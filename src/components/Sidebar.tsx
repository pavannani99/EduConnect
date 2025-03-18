export function Sidebar() {
  return (
    <div className="bg-gray-800 text-white w-64 h-full flex flex-col">
      <div className="p-4 text-lg font-bold">EduConnect</div>
      <nav className="flex-1">
        <ul>
          <li className="p-4 hover:bg-gray-700">Dashboard</li>
          <li className="p-4 hover:bg-gray-700">Classrooms</li>
          <li className="p-4 hover:bg-gray-700">Messages</li>
        </ul>
      </nav>
    </div>
  );
} 