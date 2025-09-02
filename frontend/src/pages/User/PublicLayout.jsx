import { Outlet } from 'react-router-dom';
import NavBar from '../../components/layout/NavBar';

const PublicLayout = ({ children }) => {
  return (
    <>
      <NavBar />
      {/* Main Content with top padding to account for fixed navbar */}
      <main className="flex-grow pt-20"> {/* Add pt-20 for navbar height */}
        <div className="container mx-auto">
          <Outlet />
        </div>
      </main>    
    </>
  );
};

export default PublicLayout;
