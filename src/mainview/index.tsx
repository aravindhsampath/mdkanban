import { createRoot } from "react-dom/client";
import { App } from "./components/layout/App";
import "./lib/electrobun"; // Initialize RPC + message handlers
import "./index.css";

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
