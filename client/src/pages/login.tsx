import { useEffect, useRef } from "react";
import Cookie from "js-cookie"
import { Link } from "react-router-dom";
import { checkCookie } from "../App";
const server = "http://localhost:8000"
export type serverRes = {
    success: boolean,
    msg: string
}
export default function Login() {
    useEffect(() => checkCookie(false, "/"), [])
    const usernameRef = useRef<HTMLInputElement>(null);
    const passwordRef = useRef<HTMLInputElement>(null);
    const onSubmit = () => {
        if (usernameRef.current && passwordRef.current) {
            if (usernameRef.current.value != "" && passwordRef.current.value != "") {
                const password = passwordRef.current.value;
                const username = usernameRef.current.value;
                fetch(`${server}/login`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        username, password
                    })
                }).then(res => res.json()).then((data: serverRes) => {
                    const { msg, success } = data;
                    if (success && msg) {
                        Cookie.set("token", msg, { expires: 30 })
                        window.location.href = "/home"
                    } else {
                        alert("Error")
                    }
                })
            }
        }
    }

    return <div className="h-screen w-screen flex flex-col gap-4 bg-slate-600 justify-center items-center">
        <p className="text-4xl text-yellow-200">
            Log In
        </p>
        <form onSubmit={(e) => {
            e.preventDefault();
            onSubmit()
        }} className="flex flex-col  w-1/3 px-8 py-4 rounded-md gap-8 justify-center bg-green-500">
            <div className="flex flex-col gap-2">
                <label htmlFor="usernameInput">
                    Username
                </label>
                <input id="usernameInput" ref={usernameRef} name="username" className="rounded-md px-4 py-2"></input>
            </div>
            <div className="flex flex-col gap-2">
                <label htmlFor="passwordInput">
                    Password
                </label>
                <input id="passwordInput" ref={passwordRef} type="password" name="password" className="rounded-md px-4 py-2"></input>

            </div>
            <div className="flex w-full h-full justify-center items-center">
                <button className="w-fit bg-cyan-400 px-4 py-2 rounded-md" type="submit" >Submit</button>
            </div>
        </form>
        <div className="w-1/3 h-10 flex justify-center items-center bg-green-500 rounded-md">
            <Link to={"/signup"} className="text-xl font-bold py-2">
                Sign Up Instead
            </Link>
        </div>
    </div>
}