import { useState } from "react";
import TopPage from "./pages/TopPage";
import StaffPage from "./pages/StaffPage";
import CustomerPage from "./pages/CustomerPage";
import ProductDevelopmentPage from "./pages/ProductDevelopmentPage";

export default function App() {
  const [page, setPage] = useState("top");

  if (page === "staff") return <StaffPage onNavigate={setPage} />;
  if (page === "customer") return <CustomerPage onNavigate={setPage} />;
  if (page === "product")  return <ProductDevelopmentPage onNavigate={setPage} />;
  return <TopPage onNavigate={setPage} />;
}
