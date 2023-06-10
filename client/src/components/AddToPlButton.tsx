import { useRef, useState } from "react";
import { DBSong, Playlist, plCtx, setPlCtx } from "./GlobalContext";
import { PlusIcon } from "@heroicons/react/24/solid";
import ModalWithBackdrop from "./ModalWithBackdrop";
import { Post, server } from "../App";
import cookie from "js-cookie"
export default function AddButton(props: { song: DBSong }) {
    const { song } = props;
    const pls = plCtx()
    const setPls = setPlCtx();
    const [modalShown, setModalShown] = useState(false);

    const Modal = () => {
        const idRef = useRef<HTMLSelectElement>(null)
        return <ModalWithBackdrop title="Add To Playlist" isShown={modalShown} onClick={() => { setModalShown(false) }}>
            <form className="flex flex-col gap-4 px-10 py-4" onSubmit={(e) => {
                e.preventDefault();
                if (idRef.current) {
                    const pid = idRef.current.value;
                    if (pid) {

                        Post<{
                            succcess: boolean,
                            msg: string
                        }>(`${server}/add_song_pl`, JSON.stringify({
                            pid: pid,
                            song_db_id: song.id,
                            token: cookie.get("token")
                        })).then(data => {
                            if (data.succcess) {
                                let temp: Playlist[] = [];
                                for (let i = 0; i < pls.length; i++) {
                                    if (pls[i].id = pid) {
                                        let new_pl = { ...pls[i] };
                                        new_pl.songs.push(song);
                                        temp.push(new_pl);
                                    } else {
                                        temp.push({ ...pls[i] });
                                    }
                                }
                                setPls(temp);
                                // setPls([...pls,])
                            }
                            setModalShown(false);
                        })
                    }
                }
            }}>
                <label className="text-2xl">
                    Select playlist:
                </label>
                <select name="plselect" ref={idRef} className="bg-slate-400 text-2xl font-bold pl-4 rounded-md">
                    {pls.map(pl => {
                        return <option value={pl.id} key={pl.id}>
                            {pl.title}
                        </option>
                    })}
                </select>
                <button className="rounded-md px-4 py-2 bg-purple-400 font-bold text-2xl">
                    Submit
                </button>
            </form>
        </ModalWithBackdrop>
    }



    return <>
        <Modal></Modal>
        <button className="px-4 py-2 bg-purple-400 rounded-md text-white" onClick={(e) => {
            e.stopPropagation()
            setModalShown(true);
        }}>
            <PlusIcon className="h-6 w-6"></PlusIcon>
        </button>
    </>
}