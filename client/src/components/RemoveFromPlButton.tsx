import { useState } from "react";
import { DBSong } from "./GlobalContext";
import { XMarkIcon } from "@heroicons/react/24/solid";
import ModalWithBackdrop from "./ModalWithBackdrop";
import { Post, server } from "../App";
import cookie from "js-cookie"
export default function RemoveButton(props: { song: DBSong, pid: string }) {
    const { song, pid } = props;
    // const pls = plCtx()
    // const setPls = setPlCtx();
    const [modalShown, setModalShown] = useState(false);

    const Modal = () => {
        return <ModalWithBackdrop title="Remove Song" isShown={modalShown} onClick={() => { setModalShown(false) }}>
            <div className="flex flex-col gap-10 text-2xl">
                {/* <p>Remove song?</p> */}
                <div className="flex flex-row gap-2">
                    <button className="px-4 py-2 bg-red-600 rounded-md" onClick={() => {
                        Post<{
                            success: Boolean,
                            msg: string
                        }>(`${server}/remove_song_pl`, JSON.stringify({
                            token: cookie.get("token"),
                            song_db_id: song.id,
                            pid,
                        })).then(() => {
                            setModalShown(false);

                        })
                    }}>Yes</button>
                    <button className="px-4 py-2 bg-lime-600 rounded-md" onClick={() => {
                        setModalShown(false)
                    }}>No</button>
                </div>
            </div>
        </ModalWithBackdrop>
    }



    return <>
        <Modal></Modal>
        <button className="px-4 py-2  rounded-md text-white" onClick={(e) => {
            e.stopPropagation()
            setModalShown(true);
        }}>
            <XMarkIcon className="h-6 w-6"></XMarkIcon>
            {/* <PlusIcon className="h-6 w-6"></PlusIcon> */}
        </button>
    </>
}