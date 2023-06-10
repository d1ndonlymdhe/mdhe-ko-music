import { useEffect, useState } from "react";
import { Content } from "./Layout";
import { Post, server } from "../App";
import cookie from "js-cookie";
import Spinner from "../components/Spinner";
import { serverRes } from "./login";
import { redirect } from "react-router-dom";


type Playlist = {
    custom_image: boolean,
    id: string,
    title: string,
    user_id: string,
    count: number,
}


export default function CreatePlaylistView() {
    // const defImage = "./src/assets/liked.png";
    const [isLoading, setIsLoading] = useState(true);
    const [playlist, setPlaylist] = useState<Playlist>();

    useEffect(() => {
        Post<{
            success: boolean,
            msg: {
                playlist: Playlist
            }
        }>(`${server}/create_playlist`, JSON.stringify({
            title: "",
            token: cookie.get("token")
        })).then(data => {
            if (data.success) {
                setPlaylist(data.msg.playlist);
                setIsLoading(false);
                redirect("/library")
            }
        })
    }, [])
    return <Content>
        {
            isLoading &&
            <div className="h-full w-full flex justify-center items-center">
                <Spinner className="h-20 w-20"></Spinner>

            </div>
        }
        {
            !isLoading && playlist && <><div className="">
                <form onSubmit={(e) => {
                    e.preventDefault()
                    setIsLoading(true);
                    Post<serverRes>(`${server}/edit_playlist`, JSON.stringify({
                        token: cookie.get("token"),
                        pid: playlist.id,
                        title: playlist.title
                    })).then(data => {
                        if (data.success) {
                            setIsLoading(false)
                        }

                    })
                }} className="flex flex-row gap-8 bg-gradient-to-tr from-[#281d4e] via-[#423082] to-[#513a9f] py-4 px-4">
                    <img src="./src/assets/plIcon.png" className="shadow-lg h-60 "></img>
                    <div className="flex flex-col gap-4 justify-center">
                        <p className="font-bold text-xl">
                            Playlist
                        </p>
                        <div className="flex flex-row gap-4 items-center">
                            <input className="font-bold text-6xl bg-transparent w-[60%]" value={playlist.title} name="title" onChange={(e) => {
                                if (e.target) {
                                    setPlaylist({ ...playlist, title: e.target.value })
                                }
                            }}>
                            </input>
                            <button type="submit" className="font-bold h-10 bg-purple-500 rounded-md w-fit px-4">Submit</button>
                        </div>
                        <p className="font-bold text-xl">
                            {0} songs
                        </p>
                    </div>
                </form>
            </div>
                <div className="table-header grid w-full grid-cols-[1fr_10fr_8fr_2fr_5fr] justify-start px-4 font-bold py-2 bg-[#181818]">
                    {(["#", "Title", "Artist", "Liked", "Duration"]).map(t => {
                        return <p className="text-[#c2c2c2]">
                            {t}
                        </p>
                    })}
                </div>
            </>
        }
    </Content>
}