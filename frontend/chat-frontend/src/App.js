import ChatPage from "./components/pages/ChatPage";
import LoginPage from "./components/pages/LoginPage";

function App() {
  const token = localStorage.getItem("token");

  return token ? <ChatPage /> : <LoginPage />;
}

export default App;
