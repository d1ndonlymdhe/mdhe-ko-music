import { PropsWithChildren, useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useOutletContext } from "react-router-dom";
import { Post, checkCookie, server } from "../App";
import { GlobalContextProvider, CurrentSongCtx, setCurentSongCtx, qCtx, setQCtx, setLikedInfoCtx, DBSong, Playlist, setPlCtx, queue } from "../components/GlobalContext";
import { ArrowDownIcon, ForwardIcon, PauseIcon, PlayIcon, SpeakerWaveIcon } from "@heroicons/react/24/solid";
import { GetInfoRes, PlayRes, SongInfo, generateQueue, set } from "./search";
import { RectangleStackIcon } from "@heroicons/react/24/outline";
import cookie from "js-cookie"
import LikeButton from "../components/LikeButton";
import { likedCtx } from "../components/GlobalContext";
import { setLikedCtx } from "../components/GlobalContext";
import ModalWithBackdrop from "../components/ModalWithBackdrop";
import Spinner from "../components/Spinner";

// import { SideBar } from "./search";





export default function Layout() {
    useEffect(() => checkCookie("/login", false), [])

    return <GlobalContextProvider>
        {/* <InnerLayout></InnerLayout> */}
        <Abcd></Abcd>
    </GlobalContextProvider>

}


type LSongInfo = {
    id: string,
    video_id: string,
    durationms: number,
    title: string,
    artist: string,
    thumbnail: string
}

export type getAllLikedRes = {
    success: boolean,
    msg: { songs: DBSong[] }
}

function Abcd() {
    const [modalShown, setModalShown] = useState(false);
    const q = qCtx()
    const Modal = () => {
        return <ModalWithBackdrop title="Queue" isShown={modalShown} onClick={() => {
            setModalShown(false)
        }}>
            {
                q.songs.length == 0 ? <Spinner className="h-10 w-10"></Spinner> : <Queue></Queue>
            }
            {/* <Queue></Queue> */}
        </ModalWithBackdrop>
    }
    return <>
        <InnerLayout setModalShown={setModalShown}></InnerLayout>
        <Modal></Modal>
    </>
}


function InnerLayout(props: {
    setModalShown: set<boolean>
}) {
    const audioRef = useRef<HTMLAudioElement>(null)
    const { setModalShown } = props;
    const currentSong = CurrentSongCtx()
    const setCurrentSong = setCurentSongCtx();
    // const currentSong = globalState.currentSong;
    const [vol, setVol] = useState(100);
    const [progress, setProgress] = useState(0);
    const [isPaused, setIspaused] = useState(false);
    const [autoProgress, setAutoProgress] = useState(true)
    const [barFocused, setBarFocused] = useState(false)
    // const [likedSongsInfo, setLikedSongsInfo] = useState<LSongInfo[]>([]);
    const q = qCtx();
    const setQ = setQCtx();
    const likedSongs = likedCtx();
    const setLikedSongs = setLikedCtx();
    // const likedSongsInfo = likedInfoCtx()
    const setLikedSongsInfo = setLikedInfoCtx()
    // const pls = plCtx()
    const setPls = setPlCtx()
    function nextSong() {
        const { index, songs } = q;
        let s = songs[index];
        // const q = qCtx()
        // const setQ = setQCtx()
        // console.table(songs);
        // console.log("index = ", index)
        if (s) {
            const { channel, duration_ms, id, is_liked, thumbnail_url, title, url, video_id } = s;
            if (index < q.songs.length) {
                setQ({ ...q, index: index + 1 })
                setCurrentSong({
                    currentSong: {
                        isPlaying: true,
                        passed: 0,
                        song: {
                            artist: channel,
                            durationms: duration_ms,
                            id,
                            is_liked,
                            isLiked: is_liked,
                            src: url,
                            thumbnail: thumbnail_url,
                            title,
                            video_id
                        }
                    }
                })
            } else {
                generateQueue(video_id, 10, q, setQ)
                // .then(queue => {
                //     setQ({ songs: [...q.songs, ...queue], index: index + 1 });
                //     let first = queue[0]!;
                //     const { channel, duration_ms, id, is_liked, thumbnail_url, title, url, video_id } = first;
                //     setCurrentSong({
                //         currentSong: {
                //             isPlaying: true,
                //             passed: 0,
                //             song: {
                //                 artist: channel,
                //                 durationms: duration_ms,
                //                 id,
                //                 is_liked,
                //                 isLiked: is_liked,
                //                 src: url,
                //                 thumbnail: thumbnail_url,
                //                 title,
                //                 video_id
                //             }
                //         }
                //     })
                // })
            }
        }
    }
    // function prevSong() {
    //     const { index, songs } = q;
    //     if (index > 0) {
    //         let s = songs[index - 1];
    //         if (s) {
    //             const { channel, channel_id, duration_ms, id, is_liked, thumbnail_url, title, url, video_id } = s;
    //             setQ({ ...q, index: index - 1 })
    //             setCurrentSong({
    //                 currentSong: {
    //                     isPlaying: true,
    //                     passed: 0,
    //                     song: {
    //                         artist: channel,
    //                         durationms: duration_ms,
    //                         id,
    //                         is_liked,
    //                         isLiked: is_liked,
    //                         src: url,
    //                         thumbnail: thumbnail_url,
    //                         title,
    //                         video_id
    //                     }
    //                 }
    //             })
    //         }
    //     }
    //     console.table(songs);
    //     console.log("index = ", index)

    // }


    useEffect(() => {
        if (audioRef && audioRef.current) {
            const audio = audioRef.current;
            audio.volume = vol / 100;
        }
    }, [vol])
    useEffect(() => {
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
    }, [])
    useEffect(() => {
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
    }, [])
    useEffect(() => {
        if (audioRef && audioRef.current) {
            if (progress >= 99.99) {
                // setIspaused(true)
                nextSong()
                setProgress(0)
            }
            if (!autoProgress) {
                const audio = audioRef.current;
                audio.currentTime = (currentSong.currentSong.song.durationms / 1000) * (progress > 0 ? progress / 100 : progress);

                // console.log((currentSong.currentSong.song.durationms / 1000), (progress > 0 ? progress / 100 : progress),)
                // console.log(audio.currentTime)
                setIspaused(false);
                setAutoProgress(true);
            }
        }
    }, [progress])
    useEffect(() => {
        if (audioRef && audioRef.current) {
            const audio = audioRef.current;
            if (isPaused) {
                audio.pause()
            } else {
                audio.play()
            }
        }
    }, [isPaused])
    useEffect(() => {
        if (audioRef && audioRef.current) {
            const audio = audioRef.current;
            const c = setInterval(autoScrollCallback, 1)
            function autoScrollCallback() {
                setAutoProgress(true)
                if (!audio.paused && !barFocused) {
                    if (autoProgress && audio.duration) {
                        if (audio.currentTime == 0) {
                            setProgress(0)
                        } else {
                            setProgress((audio.currentTime / audio.duration) * 100)
                        }
                    }
                }
            }
            return () => {
                clearInterval(c);
            }
        }
    }, [])
    return <>
        <div className="h-screen w-screen flex flex-col text-white">
            <div className="h-[90vh] w-full flex flex-row">
                <SideBar></SideBar>
                <Outlet></Outlet>
            </div>
            <Bottom setModalShown={setModalShown} {...{ isPaused, progress, setIspaused, setProgress, setVol, vol, autoProgress, setAutoProgress, barFocus: barFocused, setBarFocused: setBarFocused }}></Bottom>
        </div>
        <audio ref={audioRef} onPause={() => {
            setIspaused(true);
        }} onPlay={() => {
            setIspaused(false)
        }} onChange={() => {
        }} hidden src={currentSong.currentSong.song.src} autoPlay></audio>
    </>

}

export function useLikedSongs() {
    return useOutletContext<LSongInfo[]>()
}


export function SideBar() {
    return <div className="w-[15%] h-full overflow-auto grid rows-2 bg-black">
        <nav className="pt-10 flex flex-col gap-10 w-full text-center h-full ">
            <p className="font-bold text-2xl">
                MDHE KO MUSIC
            </p>
            <ul className="flex flex-col gap-10">
                {(["Search", "Library", "Create Playlist", "Liked Songs"]).map((t, i) => {
                    return <NavLink to={`${(t != "Home" ? t : "").toLowerCase().replaceAll(" ", "_")}`} key={i} className={({ isActive, isPending }) =>
                        isPending ? "" : isActive ? "font-bold" : ""
                    }>{t}</NavLink>
                })
                }
            </ul>
        </nav>
    </div>
}


type BottomProps = {
    vol: number,
    setVol: set<number>
    progress: number,
    setProgress: set<number>
    isPaused: boolean,
    setIspaused: set<boolean>,
    autoProgress: boolean,
    setAutoProgress: set<boolean>
    setBarFocused: set<boolean>
    barFocus: boolean
    setModalShown: set<boolean>
}

export function Bottom(props: BottomProps) {
    const { isPaused, progress, setIspaused, setProgress, setVol, vol, setAutoProgress, setBarFocused, setModalShown } = props;
    const globalState = CurrentSongCtx()
    const currentSong = globalState.currentSong;
    const setCurrentSong = setCurentSongCtx()
    const q = qCtx();
    const setQ = setQCtx();
    // const [showModal, setShowModal] = useState(false);
    function nextSong() {
        const { index, songs } = q;
        let s = songs[index];
        console.table(songs);
        console.log("index = ", index)
        if (s) {
            const { channel, duration_ms, id, is_liked, thumbnail_url, title, url, video_id } = s;
            if (index < q.songs.length) {
                setQ({ ...q, index: index + 1 })
                setProgress(0);
                setCurrentSong({
                    currentSong: {
                        isPlaying: true,
                        passed: 0,
                        song: {
                            artist: channel,
                            durationms: duration_ms,
                            id,
                            is_liked,
                            isLiked: is_liked,
                            src: url,
                            thumbnail: thumbnail_url,
                            title,
                            video_id
                        }
                    }
                })
            } else {
                generateQueue(video_id, 10, q, setQ)
                // .then(queue => {
                //     setQ({ songs: [...q.songs, ...queue], index: index + 1 });
                //     let first = queue[0]!;
                //     const { channel, duration_ms, id, is_liked, thumbnail_url, title, url, video_id } = first;
                //     setCurrentSong({
                //         currentSong: {
                //             isPlaying: true,
                //             passed: 0,
                //             song: {
                //                 artist: channel,
                //                 durationms: duration_ms,
                //                 id,
                //                 is_liked,
                //                 isLiked: is_liked,
                //                 src: url,
                //                 thumbnail: thumbnail_url,
                //                 title,
                //                 video_id
                //             }
                //         }
                //     })
                // })
            }
        }
    }
    function prevSong() {
        const { index, songs } = q;
        if (index > 0) {
            let s = songs[index - 1];
            if (s) {
                const { channel, duration_ms, id, is_liked, thumbnail_url, title, url, video_id } = s;
                setQ({ ...q, index: index - 1 })
                setProgress(0)
                setCurrentSong({
                    currentSong: {
                        isPlaying: true,
                        passed: 0,
                        song: {
                            artist: channel,
                            durationms: duration_ms,
                            id,
                            is_liked,
                            isLiked: is_liked,
                            src: url,
                            thumbnail: thumbnail_url,
                            title,
                            video_id
                        }
                    }
                })
            }
        }
        console.table(songs);
        console.log("index = ", index)

    }
    // const Modal = () => {
    //     return <ModalWithBackdrop title="Queue" isShown={showModal} onClick={() => {
    //         setShowModal(false)
    //     }}>
    //         <Queue></Queue>
    //     </ModalWithBackdrop>
    // }
    return <div className="w-screen grid grid-cols-[25%_50%_25%] h-[10vh] bg-[#181818] border-t-[#282828] border-t-2">
        {/* <Modal></Modal> */}
        <div className="flex flex-row">
            <div className="mx-4 flex justify-center items-center h-full w-fit">
                {
                    currentSong.isPlaying &&
                    <img src={currentSong.song.thumbnail} className="h-20 aspect-[180/101] rounded-md" alt={currentSong.song.title}></img>
                }
            </div>
            <div className="flex flex-row">
                <div className="flex justify-evenly flex-col">
                    <p className="font-bold">
                        {currentSong.song.title}
                    </p>
                    <p>
                        {
                            currentSong.song.artist
                        }
                    </p>
                </div>
                <div className="flex justify-center items-center h-full w-1/4">
                    {
                        currentSong.isPlaying &&
                        <div className="flex flex-row gap-2 ml-4">
                                <LikeButton is_liked={currentSong.song.is_liked} song_id={currentSong.song.id}></LikeButton>
                                <a download={true} href={currentSong.song.src} target="_blank" className="px-4 py-2"><ArrowDownIcon className="h-6 w-6"></ArrowDownIcon></a>
                            </div>
                    }
                </div>
            </div>
        </div>
        <div className="h-full w-full flex flex-col justify-center gap-4 items-center">
            <div className="mt-4">
                <div className="w-full h-full grid grid-cols-3 content-evenly gap-10">
                    <button onClick={() => { prevSong() }}>
                        <ForwardIcon className="h-6 w-6 rotate-180"></ForwardIcon>
                    </button>
                    <button onClick={() => {
                        setIspaused(!isPaused);
                    }}>

                        {
                            isPaused && <PlayIcon className="h-6 w-6"></PlayIcon>
                        }
                        {
                            !isPaused && <PauseIcon className="h-6 w-6"></PauseIcon>

                        }
                    </button>
                    <button onClick={() => { nextSong() }}>
                        <ForwardIcon className="h-6 w-6"></ForwardIcon>
                    </button>
                </div>
            </div>
            <div className="w-full h-full grid grid-cols-[25%_50%_25%] justify-items-center items-center">
                <p className="text-right w-full pr-4">
                    {msToMinutes(progress * currentSong.song.durationms / 100)}
                </p>
                <input type="range" className="w-full" value={progress} max={100} min={0} onFocus={() => {
                    setBarFocused(true)
                    setAutoProgress(false)
                }} onChange={(e) => {
                    setAutoProgress(false)
                    setBarFocused(false);
                    setProgress(Number(e.target.value))
                }}></input>
                <p className="text-left w-full pl-4">
                    {msToMinutes(currentSong.song.durationms)}
                </p>

            </div>
        </div>
        <div className="w-full flex flex-row justify-end items-center gap-4">
            <div onClick={() => {
                setModalShown(true);
            }}>
                <RectangleStackIcon className="h-6 w-6"></RectangleStackIcon>
            </div>
            <div>
                <SpeakerWaveIcon className="w-6 h-6 text-green-500"></SpeakerWaveIcon>
            </div>
            <input type="range" className="mr-4" min={0} max={100} value={vol}

                onChange={(e) => {

                    setVol(Number(e.target.value));
                }}></input>
        </div>
    </div >
}

export async function generateQueueFromArr(arr: string[], q: queue, setQ: (newState: queue) => void) {
    let next_id = arr[0]
    for (let i = 0; i < arr.length; i++) {
        console.log("Fetching")
        const data = await Post<GetInfoRes>(`${server}/get_song_info`, JSON.stringify({
            token: cookie.get("token"),
            song_id: next_id
        }))
        if (data.success) {
            const { channel, channel_id, duration_ms, id, is_liked, thumbnail_url, title, video_id } = data.msg.info;
            let temp: SongInfo = {
                channel,
                channel_id,
                duration_ms,
                id,
                is_liked,
                thumbnail_url,
                title,
                url: data.msg.url,
                video_id
            }
            let tempq = { ...q }
            tempq.songs.push(temp)
            setQ(tempq)

            // retArr.push(temp);
        }
        next_id = arr[i + 1];
    }
    // return retArr;
}


function Queue() {
    const q = qCtx();
    const setQ = setQCtx();
    const setCurrentSong = setCurentSongCtx()
    const currentSong = CurrentSongCtx()
    return <div className=" flex flex-col gap-2  max-h-[60vh] overflow-auto">
        {
            q.songs.map((s, i) => {
                return <div key={s.id} className="flex flex-row gap-2 text-white hover:bg-slate-500 cursor-pointer rounded-md py-2" onClick={() => {
                    fetch(`${server}/play?id=${s.video_id}`).then(res => res.json()).then((data: PlayRes) => {
                        const { msg, success } = data;
                        console.log(data)
                        if (success && msg) {
                            setCurrentSong({
                                ...currentSong,
                                currentSong: {
                                    song: {
                                        id: s.id,
                                        artist: s.channel,
                                        durationms: s.duration_ms,
                                        video_id: s.video_id,
                                        isLiked: false,
                                        src: msg.url,
                                        thumbnail: s.thumbnail_url,
                                        title: s.title,
                                        is_liked: s.is_liked
                                    },
                                    isPlaying: true,
                                    passed: 0
                                }
                            })
                            setQ({ ...q, index: i })
                        }
                    })
                }}>
                    <div className="h-12 w-12 flex justify-center items-center">
                        {
                            (currentSong.currentSong.song.id == s.id) ? <PlayIcon className="h-6 w-6"></PlayIcon> : undefined
                        }
                    </div>
                    <div className="flex flex-row gap-4  items-center">
                        <img src={s.thumbnail_url} className="h-20 aspect-[180/101] rounded-md" alt={s.title}></img>
                        <p className="font-bold"> {s.title}</p>
                    </div>
                </div>
            })
        }
    </div>
}




export function Content(props: PropsWithChildren) {
    return <div className="w-[85%] h-full overflow-auto bg-[#121212]">
        {props.children}
    </div>
}

export function msToMinutes(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const rem = seconds % 60;
    return (minutes < 10 ? ("0" + minutes) : minutes) + ":" + (rem < 10 ? ("0" + rem) : rem);
}  