import { Outlet } from "react-router-dom";
import "../../../components/scholarships/scholarships.css";

export default function ScholarshipAdminLayout() {
  return (
    <div className="sch-app sch-admin">
      <Outlet />
    </div>
  );
}
