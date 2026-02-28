import React from "react";
import { ToastContainer, toast } from "react-toastify";
const ToasterContext = React.createContext();

export const useToaster = () => React.useContext(ToasterContext);
export const ToasterProvider = ({ children }) => {
  const showToast = (message, type = "info") => {
    toast(message, { type });
  };

  return (
    <ToasterContext.Provider value={{ showToast }}>
      {children}
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar />
    </ToasterContext.Provider>
  );
};
