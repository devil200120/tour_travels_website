import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

const PageTransition = ({ children }) => {
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [transitionStage, setTransitionStage] = useState("fadeIn");

  useEffect(() => {
    if (location !== displayLocation) {
      setTransitionStage("fadeOut");
    }
  }, [location, displayLocation]);

  useEffect(() => {
    if (transitionStage === "fadeOut") {
      const timeout = setTimeout(() => {
        setDisplayLocation(location);
        setTransitionStage("fadeIn");
      }, 150); // Half of transition duration

      return () => clearTimeout(timeout);
    }
  }, [transitionStage, location]);

  return (
    <div
      className={`transition-all duration-300 ease-out ${
        transitionStage === "fadeOut"
          ? "opacity-0 transform translate-y-2 scale-95"
          : "opacity-100 transform translate-y-0 scale-100"
      }`}
      key={displayLocation.pathname}
    >
      {children}
    </div>
  );
};

export default PageTransition;
