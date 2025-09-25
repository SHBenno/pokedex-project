'use client';
import { authClient } from "@/app/lib/auth-client";
import Image from "next/image"
import { useState } from "react";
import validator from "validator";

export default function signin(){
    const [emailHelperText, setEmailHelperText] = useState("");
    const [passwordHelperText, setPasswordHelperText] = useState("");
    
    const signupUser = async(event: React.SyntheticEvent<HTMLFormElement>) => {
        event.preventDefault();
        const form = event.currentTarget;
        const formData = form.elements as typeof form.elements & {
            email: {value: string},
            password: {value: string}
        }
    
        if (!formData.email.value || !formData.password.value) {
            if (!formData.email.value) setEmailHelperText("Please enter your email address");
            if (!formData.password.value) setPasswordHelperText("Please enter a password");
            return;
        }
    
        if (!validator.isEmail(formData.email.value)) {
            setEmailHelperText("Invalid email address");
            return;
        }
            
        const { data, error } = await authClient.signIn.email({
            email: formData.email.value,
            password: formData.password.value,
            callbackURL: "/pokemon"
        }, {
            onError: (ctx) => {
                const errorCode = ctx.error.code;
                if ((errorCode as string).toLowerCase().includes("email")) {
                    setEmailHelperText(ctx.error.message);
                } else if ((errorCode as string).toLowerCase().includes("password")) {
                    setEmailHelperText(ctx.error.message);
                }
            }
            })
        }
    
        return (
            <div className="flex items-center justify-center w-screen h-screen">
                <div className="flex items-center justify-center rounded-lg bg-slate-800 outline outline-slate-700">
                    <form onSubmit={signupUser}>
                        <div>
                            <div className="flex flex-col items-center justify-center gap-3 p-10">
                                <div className="flex flex-col items-center justify-center">
                                    <Image src="/pokemon.png" width={100} height={100} className="mb-3" alt="Pokemon Logo"/>
                                    <h1 className="font-black text-xl mt-[-10px]">Sign in</h1>
                                </div>
                                <div>
                                    <h6 className="font-semibold text-xs text-slate-300">Email <a className="font-semibold text-xs text-red-500">*</a></h6>
                                    <input placeholder="Enter your email" name="email" className={`outline p-2 rounded-sm text-slate-100 ${ emailHelperText ? "outline-red-500" : "outline-slate-700" }`}></input>
                                    <span className="w-full">{
                                        emailHelperText && <h6 className="font-semibold text-xs text-red-500">{emailHelperText}</h6>
                                    }</span>
                                </div>
                                <div>
                                    <h6 className="font-semibold text-xs text-slate-300">Password <a className="font-semibold text-xs text-red-500">*</a></h6>
                                    <input placeholder="Enter your password" name="password" type="password" className={`outline p-2 rounded-sm text-slate-100 ${ passwordHelperText ? "outline-red-500" : "outline-slate-700" }`}></input>
                                    <span className="w-full">{
                                        passwordHelperText && <h6 className="font-semibold text-xs text-red-500">{passwordHelperText}</h6>
                                    }</span>
                                </div>
                                <span className="w-full">
                                    <h6 className="font-semibold text-xs text-blue-500">Don't have an account? <a className="text-blue-300 hover:text-blue-400" href="/auth/signup">Sign up!</a></h6>
                                </span>
                                <button className="mt-5 bg-blue-500 hover:bg-blue-600 p-1 w-full rounded-md outline outline-blue-600 hover:outline-blue-500">Submit</button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        )
}