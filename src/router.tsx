import { lazy, Suspense } from "react";
import { createBrowserRouter } from "react-router-dom";
import AppShell from "./components/AppShell";
import HomePage from "./pages/HomePage";
import NotFound from "./components/NotFound";
import RouteFallback from "./components/RouteFallback";

// Lazy-loaded: pulls react-markdown + react-syntax-highlighter off the
// critical path. First doc visit fetches the chunk; subsequent doc visits
// are instant since it is cached.
const DocPage = lazy(() => import("./pages/DocPage"));

function withSuspense(node: React.ReactNode) {
  return <Suspense fallback={<RouteFallback />}>{node}</Suspense>;
}

export const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { path: "/", element: <HomePage /> },
      { path: ":category/:subcategory", element: withSuspense(<DocPage />) },
      { path: "*", element: <NotFound /> },
    ],
  },
]);
