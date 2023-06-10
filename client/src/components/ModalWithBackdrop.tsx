import { PropsWithChildren, useEffect, useState } from "react";




type ModalWithBackdropProps = {
    onClick?: () => void,
    title: string,
    className?: string,
    isShown: boolean
}




export default function ModalWithBackdrop(props: PropsWithChildren<ModalWithBackdropProps>) {
    const { onClick, title, className, isShown } = props;
    const [scrollPos] = useState({ x: 0, y: 0 })
    // useEffect(() => {
    //     console.log("changed")
    //     if (isShown) {
    //         const x = window.scrollX;
    //         const y = window.scrollY;
    //         setScrollPos({ x, y });
    //     }
    // }, [isShown])
    useEffect(() => {
        const onEsc = (e: KeyboardEvent) => {
            if (e.keyCode == 27) {
                onClick && onClick()
                window.removeEventListener("keydown", onEsc);
            }
        };
        window.addEventListener("keydown", onEsc);
    }, []);
    return <>
        {
            isShown && <div style={{
                top: `${scrollPos.y}px`
            }} className={`absolute h-screen w-screen left-0 z-[100] flex justify-center items-center backdrop-blur-sm overflow-hidden`} onClick={() => { onClick && onClick() }}>
                <div className={`bg-[#282828] flex flex-col justify-center items-center px-2 pb-2 rounded-xl ${className}`} onClick={(e) => { e.stopPropagation() }}>
                    <div className="flex flex-col px-4 py-2 my-2 w-full gap-5">
                        <div className="text-left text-white text-2xl font-bold mb-2">{title}</div>
                        {
                            props.children
                        }
                    </div>
                </div>
            </div>
        }
    </>
}