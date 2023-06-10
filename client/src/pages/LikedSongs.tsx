import { PropsWithChildren, useState } from "react"
import { Content, generateQueueFromArr, getAllLikedRes, msToMinutes } from "./Layout"
import { CurrentSongCtx, currentSongInit, likedCtx, likedInfoCtx, qCtx, setCurentSongCtx, setLikedCtx, setLikedInfoCtx, setQCtx } from "../components/GlobalContext"
import LikeButton from "../components/LikeButton"
import { v4 } from "uuid"
import { Post, server } from "../App"
import cookie from "js-cookie"
// import { serverRes } from "./login"
import { PlayRes } from "./search"
import { ArrowPathIcon } from "@heroicons/react/24/solid"
import AddButton from "../components/AddToPlButton"
export default function LikedSongs() {
    const likedSongsInfo = likedInfoCtx()
    const videoIds = likedSongsInfo.map(l => { return l.video_id })
    const likedSongs = likedCtx()
    const setLikedSongs = setLikedCtx()
    const setLikedSongsInfo = setLikedInfoCtx()
    const currentSong = CurrentSongCtx()
    const setCurrentSong = setCurentSongCtx()
    const setQ = setQCtx()
    const q = qCtx()
    const [playLoading, setPlayloading] = useState(false);
    return <Content>
        <div className="flex flex-row justify-between bg-gradient-to-tr from-[#281d4e] via-[#423082] to-[#513a9f] py-4 px-4">
            <div className="flex flex-row gap-8">
                <img src="./src/assets/liked.png" className="shadow-lg h-60 "></img>
                <div className="flex flex-col gap-4 justify-center">
                    <p className="font-bold text-xl">
                        Playlist
                    </p>
                    <p className="font-bold text-6xl">
                        Liked Songs
                    </p>
                    <p className="font-bold text-xl">
                        {likedSongsInfo.length} songs
                    </p>
                </div>
            </div>
            <div>
                <button className="px-10 py-2 bg-cyan-400 h-fit rounded-full" onClick={() => {
                    Post<getAllLikedRes>(`${server}/get_all_liked`, JSON.stringify({ token: cookie.get("token") })).then(data => {
                        if (data.success) {
                            const temp = new Set(likedSongs);
                            data.msg.songs.forEach(s => {
                                temp.add(s.id);
                            })
                            setLikedSongs(temp);
                            setLikedSongsInfo(data.msg.songs)
                        }
                    })
                }}><ArrowPathIcon className="text-white h-6 w-6"></ArrowPathIcon></button>
            </div>
        </div>
        <div className="table-header grid w-full grid-cols-[1fr_10fr_8fr_2fr_5fr_1fr] justify-start px-4 font-bold py-2 bg-[#181818]">
            {(["#", "Title", "Artist", "Liked", "Duration"]).map(t => {
                return <p className="text-[#c2c2c2]" key={v4()}>
                    {t}
                </p>
            })}
        </div>
        {
            likedSongsInfo.map((song, i) => {
                return <div key={v4()} className="grid w-full grid-cols-[1fr_10fr_8fr_2fr_5fr_1fr] justify-start px-4 font-bold py-2 hover:bg-[#3b3b3b] cursor-pointer" onClick={() => {
                    if (!playLoading) {
                        setPlayloading(false);
                        setCurrentSong(currentSongInit);
                        setQ({
                            songs: [],
                            index: 0
                        })
                        fetch(`${server}/play?id=${song.video_id}`).then(res => res.json()).then((data: PlayRes) => {
                            const { msg, success } = data;
                            setQ({
                                index: 0,
                                songs: []
                            })
                            if (success) {
                                // if (q.songs.length < videoIds.length) {
                                setPlayloading(false);
                                console.log(videoIds.slice(i + 1, videoIds.length))
                                generateQueueFromArr(videoIds.slice(i + 1, videoIds.length), q, setQ)
                                // }
                                // .then(q => {
                                //     setQ({
                                //         index: 0,
                                //         songs: q
                                //     })
                                // })
                                setCurrentSong({
                                    ...currentSong,
                                    currentSong: {
                                        song: {
                                            id: song.id,
                                            artist: song.artist,
                                            durationms: song.durationms,
                                            video_id: song.video_id,
                                            isLiked: likedSongs.has(song.id),
                                            src: msg.url,
                                            thumbnail: song.thumbnail,
                                            title: song.title,
                                            is_liked: likedSongs.has(song.id),
                                        },
                                        isPlaying: true,
                                        passed: 0
                                    }
                                })
                            }
                        })

                    }
                }}>
                    <TableCell>
                        {i + 1}
                    </TableCell>
                    <TableCell>
                        <div>
                            <img src={song.thumbnail} className="h-8"></img>
                        </div>
                        <div>{song.title}</div>
                    </TableCell>
                    <TableCell>
                        {song.artist}
                    </TableCell>
                    <TableCell>
                        <LikeButton is_liked={likedSongs.has(song.id)} song_id={song.id} className="h-6 w-6"></LikeButton>
                    </TableCell>
                    <TableCell>
                        {msToMinutes(Number(song.durationms))}
                    </TableCell>
                    <TableCell>
                        <AddButton song={song}></AddButton>
                    </TableCell>
                </div>
            })
        }
        <div>

        </div>
    </Content>
}

export function TableCell(props: PropsWithChildren) {
    return <div className="flex flex-row items-center gap-2">
        {props.children}
    </div>
}


// export async function generateQueueFromArr()