import { ArrowLeftIcon, ArrowPathIcon, XMarkIcon } from "@heroicons/react/24/solid";
import { CurrentSongCtx, Playlist, currentSongInit, likedCtx, plCtx, qCtx, setCurentSongCtx, setPlCtx, setQCtx } from "../components/GlobalContext";
import { Content, generateQueueFromArr, msToMinutes } from "./Layout";
import { TableCell } from "./LikedSongs";
import { Post, server } from "../App";
// import { serverRes } from "./login";
import LikeButton from "../components/LikeButton";
import React, { useState } from "react";
import { PlayRes } from "./search";
import cookie from "js-cookie"
import AddButton from "../components/AddToPlButton";
import RemoveButton from "../components/RemoveFromPlButton";
import { v4 } from "uuid";
export default function Library() {
    const pls = plCtx()
    const setPls = setPlCtx()
    // const liked = likedCtx()
    // const setLiked = setLikedCtx()
    const [activePl, setActivePl] = useState<Playlist | undefined>()
    return <Content>
        {
            activePl ? <PlaylistRenderer setActivePl={setActivePl} pl={activePl}></PlaylistRenderer> : <>
                <div className="w-full h-20 flex flex-row justify-between items-center px-2">
                    <p className="font-bold text-4xl text-center p-4">Library</p>
                    <button onClick={() => {
                        Post<{
                            success: boolean,
                            msg: {
                                pls: Playlist[]
                            }
                        }>(`${server}/get_all_pls`, JSON.stringify({
                            token: cookie.get("token"),
                        })).then(data => {
                            const { msg, success } = data;
                            if (success) {
                                const { pls } = msg;
                                setPls(pls);
                            }
                        })
                    }} className="px-10 py-2 bg-cyan-400 h-fit rounded-full"><ArrowPathIcon className="text-white h-6 w-6"></ArrowPathIcon></button>
                </div>
                <div className="flex flex-row flex-wrap gap-10 mx-4 my-4">
                    {
                        pls.map(pl => {
                            return <div key={pl.id} onClick={() => {
                                setActivePl(pl)
                            }}>
                                <div className="flex flex-col h-80 w-80 items-center rounded-md bg-slate-500 gap-4 cursor-pointer">
                                    <img className="h-60 w-60 rounded-md" src="./src/assets/plIcon.png"></img>
                                    <div className="flex flex-row justify-between px-4 w-full">
                                        <p className="font-bold text-xl">{pl.title}</p>
                                        <div className="px-4 py-2 rounded-md hover:bg-red-500" onClick={(e) => {
                                            e.stopPropagation();
                                            Post<{
                                                success: boolean,
                                                msg: any
                                            }>(`${server}/delete_pl`, JSON.stringify({
                                                token: cookie.get("token"),
                                                pid: pl.id
                                            })).then(data => {
                                                if (data.success) {
                                                    const temp: Playlist[] = []
                                                    for (let i = 0; i < pls.length; i++) {
                                                        if (pl.id != pls[i].id) {
                                                            temp.push(pls[i])
                                                        }
                                                    }
                                                    setPls(temp);
                                                }
                                            })
                                        }}> <XMarkIcon className="h-6 w-6"></XMarkIcon> </div>
                                    </div>
                                </div>
                            </div>
                        })
                    }
                </div>
            </>
        }

    </Content>
}

export type Set<T> = React.Dispatch<React.SetStateAction<T>>


function PlaylistRenderer(props: { pl: Playlist, setActivePl: Set<Playlist | undefined> }) {
    const likedSongs = likedCtx()
    const currentSong = CurrentSongCtx()
    const setCurrentSong = setCurentSongCtx()
    const { pl, setActivePl } = props;
    const q = qCtx()
    const setQ = setQCtx()
    const videoIds = pl.songs.map(s => s.video_id)
    const [playLoading, setPlayLoading] = useState(false);
    return <>
        <div className="flex flex-row justify-between bg-gradient-to-tr from-[#281d4e] via-[#423082] to-[#513a9f] py-2 px-4">
            <div className="flex flex-col gap-2">
                <div>
                    <button onClick={() => {
                        setActivePl(undefined)
                    }} className="px-10 py-2 bg-cyan-400 h-fit rounded-full">
                        <ArrowLeftIcon className="h-6 w-6 text-white"></ArrowLeftIcon>
                    </button>
                </div>
                <div className="flex flex-row gap-8">
                    <div className="bg-pink-600 rounded-md"><img src="./src/assets/plIcon.png" className="shadow-lg h-60 "></img></div>
                    <div className="flex flex-col gap-4 justify-center">
                        <p className="font-bold text-xl">
                            Playlist
                        </p>
                        <p className="font-bold text-6xl">
                            {pl.title}
                        </p>
                        <p className="font-bold text-xl">
                            {pl.count} songs
                        </p>
                    </div>
                </div>
            </div>
        </div>
        <div className="table-header grid w-full grid-cols-[1fr_10fr_8fr_2fr_5fr_1fr_1fr] justify-start px-4 font-bold py-2 bg-[#181818]">
            {(["#", "Title", "Artist", "Liked", "Duration"]).map(t => {
                return <p className="text-[#c2c2c2]" key={v4()}>
                    {t}
                </p>
            })}
        </div>
        {
            pl.songs.map((song, i) => {
                return <div key={song.id} className="grid w-full grid-cols-[1fr_10fr_8fr_2fr_5fr_1fr_1fr] justify-start px-4 font-bold py-2 hover:bg-[#3b3b3b] cursor-pointer" onClick={() => {
                    if (!playLoading) {
                        setPlayLoading(true);
                        setQ({
                            index: 0,
                            songs: []
                        })
                        setCurrentSong(currentSongInit)
                        fetch(`${server}/play?id=${song.video_id}`).then(res => res.json()).then((data: PlayRes) => {
                            const { msg, success } = data;
                            setPlayLoading(false)
                            if (success) {
                                generateQueueFromArr(videoIds.slice(i + 1, videoIds.length), q, setQ)
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
                    <TableCell>
                        <RemoveButton song={song} pid={pl.id}></RemoveButton>
                    </TableCell>
                </div>
            })
        }
        <div>

        </div>
    </>
}