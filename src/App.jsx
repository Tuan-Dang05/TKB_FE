import React, { useEffect } from 'react';
import TimeTable from "./components/timeTable";
import './index.css'

const App = () => {
   
  useEffect(() => {
    const originalTitle = document.title;

    const handleBlur = () => {
      document.title = "Quay lại đâyyyy!!";
    };

    const handleFocus = () => {
      document.title = originalTitle;
    };

    // Attach event listeners
    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);

    // Cleanup event listeners on component unmount
    return () => {
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
    };
  }, []); // Empty dependency array ensures this runs only once after initial render
    return (
        <div>
            <TimeTable/>
        </div>
    );
};

export default App;