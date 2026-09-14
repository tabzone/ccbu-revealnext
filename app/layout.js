import { AuthProvider } from "./components/AuthProvider";
import AuthWrapper from "./components/AuthWrapper";
import { ThemeProvider } from "./components/ThemeProvider";
import { ToastContainer } from "react-toastify";

import "./globals.css";
import "./styles/analytic.css";
import "react-toastify/dist/ReactToastify.css";

export const metadata = {
  title: "Reveal",
  description: "Reveal Space Analysis System",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          <AuthProvider>
            <AuthWrapper>
              {children}
            </AuthWrapper>
          </AuthProvider>
        </ThemeProvider>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          pauseOnHover
          draggable
          theme="light"
        />
      </body>
    </html>
  );
}