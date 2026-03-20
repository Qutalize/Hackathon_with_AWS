import { useState } from "react";
import TopPage from "./pages/TopPage";
import StaffPage from "./pages/StaffPage";
import CustomerPage from "./pages/CustomerPage";

export default function App() {
  const [page, setPage] = useState("top");

  if (page === "staff") return <StaffPage onNavigate={setPage} />;
  if (page === "customer") return <CustomerPage onNavigate={setPage} />;
  return <TopPage onNavigate={setPage} />;
}
