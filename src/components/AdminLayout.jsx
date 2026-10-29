const AdminLayout = ({ children }) => {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#f8f9fb] text-slate-900">
      {children}
    </div>
  );
};

export default AdminLayout;
