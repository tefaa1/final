"use client";
import Login from "@/src/components/Login";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const handleLogin = async (username, password) => {
    try {
      const res = await fetch("http://localhost:8080/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("token", data.accessToken);
        localStorage.setItem("loggedIn", "true");

        console.log("Login success");
        router.push("/dashboard");
      } else {
        alert("Login Failed");
      }
    } catch (err) {
      console.error(err);
    }
  };

  return <Login onLogin={handleLogin} />;
}




// "use client";
// import Login from "@/src/components/Login";
// import { useRouter } from "next/navigation";


// export default function LoginPage() {
//   const router = useRouter();

//   const handleLogin = () => {
//     localStorage.setItem("loggedIn", "true");
//     router.push("/dashboard");
//   };

//   return <Login onLogin={handleLogin} />;
// }
