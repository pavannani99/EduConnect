import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import * as z from 'zod';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@prisma/client';

const classroomSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  section: z.string().min(1, "Section is required"),
  isPrivate: z.boolean().default(true),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const searchQuery = searchParams.get('search');
  const listForUserId = searchParams.get('userId'); // For fetching classrooms a specific user is in (e.g. for messages)

  try {
    const userWithCollege = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { collegeId: true, role: true },
    });

    if (!userWithCollege?.collegeId && session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'User not associated with a college' }, { status: 400 });
    }

    let whereClause: any = {
      AND: [],
    };

    if (listForUserId && listForUserId === session.user.id) {
      // Fetch only classrooms the current user is a member of
       whereClause.AND.push({
        members: { some: { id: session.user.id } },
      });
    } else if (session.user.role === UserRole.ADMIN) {
      // Admin can see all classrooms, optionally filtered by college if collegeId is present
      if (userWithCollege?.collegeId) {
         whereClause.AND.push({ collegeId: userWithCollege.collegeId });
      }
    } else {
      // Students and CRs see classrooms in their college: either public or they are a member
      whereClause.AND.push({ collegeId: userWithCollege.collegeId });
      whereClause.AND.push({
        OR: [
          { isPrivate: false },
          { members: { some: { id: session.user.id } } },
        ],
      });
    }

    if (searchQuery) {
      whereClause.AND.push({
        OR: [
          { name: { contains: searchQuery, mode: 'insensitive' } },
          { section: { contains: searchQuery, mode: 'insensitive' } },
        ],
      });
    }

    // If AND array is empty, remove it to avoid Prisma errors with empty AND
    if (whereClause.AND.length === 0) {
      delete whereClause.AND;
    }


    const classrooms = await prisma.classroom.findMany({
      where: whereClause,
      include: {
        owner: { select: { id: true, name: true } },
        _count: { select: { members: true } },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(classrooms);
  } catch (error) {
    console.error("Error fetching classrooms:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Allow ADMINs to create classrooms as well
    if (![UserRole.CR, UserRole.ADMIN].includes(session.user.role as UserRole)) {
      return NextResponse.json(
        { error: 'Only CRs or Admins can create classrooms' },
        { status: 403 }
      );
    }

    const json = await req.json();
    const body = classroomSchema.parse(json);

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { collegeId: true },
    });

    if (!user?.collegeId) {
      // Admins might not have a collegeId if they are super admins.
      // For now, let's assume classrooms are always tied to a college.
      // This could be a setting or based on the admin's profile.
      // For simplicity, if admin has no collegeId, they can't create a classroom here.
      // Or, we could allow them to specify a collegeId if they are ADMIN.
      // Current schema requires collegeId for a classroom.
      return NextResponse.json(
        { error: 'User must be associated with a college to create a classroom.' },
        { status: 400 }
      );
    }

    const existingClassroom = await prisma.classroom.findFirst({
      where: {
        collegeId: user.collegeId,
        section: body.section,
      },
    });

    if (existingClassroom) {
      return NextResponse.json(
        { error: 'A classroom with this section already exists in your college' },
        { status: 400 }
      );
    }

    const classroom = await prisma.classroom.create({
      data: {
        name: body.name,
        section: body.section,
        isPrivate: body.isPrivate,
        collegeId: user.collegeId,
        ownerId: session.user.id,
        members: {
          connect: { id: session.user.id },
        },
      },
       include: { // Include owner and member count for consistency with GET
        owner: { select: { id: true, name: true } },
        _count: { select: { members: true } },
      }
    });

    return NextResponse.json(classroom, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("Error creating classroom:", error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 