"use client"

import * as z from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { AuthBanner } from "../../components/AuthBanner";
import "../../General.css";

const formSchema = z.object({
    name: z.string().min(3, "El nombre es obligatorio"),
    lastName: z.string().min(3, "El apellido es obligatorio"),
    email: z.string().email("El correo no es válido"),
    password: z.string().min(8, "La contraseña debe ser de al menos 8 caracteres"),
    repeatPassword: z.string().min(8, "Las contraseñas deben ser iguales"),
    terms: z.boolean().refine((value) => value, "Debes aceptar el aviso de privacidad y los términos de uso"),
})

export default function CreateUserForm() {
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            lastName: "",
            email: "",
            password: "",
            repeatPassword: "",
            terms: false,
        },
    })

    const onSubmit = (data: z.infer<typeof formSchema>) => {
        console.log(data)
    }

    return (
        <div className="login-wrapper">
            <AuthBanner currentStep={1} />
            <div className="flex flex-1 items-center justify-center p-8">
                <div className="bg-white rounded-2xl p-8 shadow-sm">
                    <h6 className="text-xs text-blue-600 font-bold">SISTEMA INTEGRAL ZIGZAG</h6>
                    <h1 className="text-3xl font-bold text-black">Crear cuenta</h1>
                    <p className="text-sm text-gray-500">Ingresa tus datos para crear una cuenta</p>
                    <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-lg">
                        <div className="grid grid-cols-2 gap-4 text-left">
                            <div>
                                <label htmlFor="name" className="block mb-1 text-sm font-medium">Nombre(s)</label>
                                <input
                                    type="text"
                                    id="name"
                                    {...register("name")}
                                    className="border border-gray-300 rounded-md px-3 py-2 w-full"
                                />
                                {errors.name && (
                                    <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
                                )}
                            </div>
                            <div>
                                <label htmlFor="lastName" className="block mb-1 text-sm font-medium">Apellidos</label>
                                <input
                                    type="text"
                                    id="lastName"
                                    {...register("lastName")}
                                    className="border border-gray-300 rounded-md px-3 py-2 w-full"
                                />
                                {errors.lastName && (
                                    <p className="text-red-500 text-sm mt-1">{errors.lastName.message}</p>
                                )}
                            </div>
                            <div className="col-span-2">
                                <label htmlFor="email" className="block mb-1 text-sm font-medium">Correo electrónico</label>
                                <input
                                    type="email"
                                    id="email"
                                    {...register("email")}
                                    className="border border-gray-300 rounded-md px-3 py-2 w-full"
                                />
                                {errors.email && (
                                    <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                                )}
                            </div>
                            <div>
                                <label htmlFor="password" className="block mb-1 text-sm font-medium">Contraseña</label>
                                <input
                                    type="password"
                                    id="password"
                                    {...register("password")}
                                    className="border border-gray-300 rounded-md px-3 py-2 w-full"
                                />
                                {errors.password && (
                                    <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
                                )}
                            </div>
                            <div>
                                <label htmlFor="repeatPassword" className="block mb-1 text-sm font-medium">Confirmar Contraseña</label>
                                <input
                                    type="password"
                                    id="repeatPassword"
                                    {...register("repeatPassword")}
                                    className="border border-gray-300 rounded-md px-3 py-2 w-full"
                                />
                                {errors.repeatPassword && (
                                    <p className="text-red-500 text-sm mt-1">{errors.repeatPassword.message}</p>
                                )}
                            </div>
                            <div className="col-span-2">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="terms"
                                        {...register("terms")}
                                        className="border border-gray-300 rounded-md px-3 py-2"
                                    />
                                    <label htmlFor="terms" className="text-sm">Acepto el aviso de privacidad y los términos de uso</label>
                                </div>
                                {errors.terms && (
                                    <p className="text-red-500 text-sm mt-1">{errors.terms.message}</p>
                                )}
                            </div>
                            <button
                                type="submit"
                                className="col-span-2 bg-blue-500 text-white rounded-md px-3 py-2"
                            >
                                Crear cuenta y enviar código
                            </button>
                            <div className="col-span-2 text-center mt-4">
                                <a href="/login" className="text-blue-500 text-sm">¿Ya tienes una cuenta? Inicia sesión</a>
                            </div>
                            <div>
                                <p>Recibirás un código de verificación en tu correo.</p>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
