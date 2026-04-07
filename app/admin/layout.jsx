export const metadata = {
  title: "Debrief Admin",
  description: "Content management for Debrief",
};

export default function AdminLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#2a2726] text-[#f6f4f1] font-sans selection:bg-[#50c878] selection:text-white">
      {children}
    </div>
  );
}
