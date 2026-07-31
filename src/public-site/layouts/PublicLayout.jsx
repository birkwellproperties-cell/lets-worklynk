import {
  Outlet,
} from "react-router";

import PublicFooter from "../components/PublicFooter";
import PublicHeader from "../components/PublicHeader";

export default function PublicLayout() {
  return (
    <div className="min-h-screen bg-slate-50">
      <PublicHeader />

      <Outlet />

      <PublicFooter />
    </div>
  );
}
