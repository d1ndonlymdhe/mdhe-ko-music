import { PropsWithChildren, createContext, useContext, useState } from "react";
import { SongInfo } from "../pages/search";




type Song = {
    id: string,
    title: string,
    artist: string,
    video_id: string,
    durationms: number,
    isLiked: boolean,
    thumbnail: string,
    src: string,
    is_liked: boolean
}

type CurrentSong = {
    song: Song,
    passed: number,
    isPlaying: boolean,
}
type CurrentSongInit = {
    currentSong: CurrentSong;
}

export const currentSongInit: CurrentSongInit = {
    currentSong: {
        song: {
            id: "",
            title: "",
            artist: "",
            video_id: "",
            durationms: 0,
            isLiked: false,
            thumbnail: "",
            src: "",
            is_liked: false
        },
        passed: 0,
        isPlaying: false
    }
}

const CurrentSongContext = createContext(currentSongInit)
//@ts-ignore
const CurrentSongUpdateContext = createContext((newState: typeof currentSongInit) => {
})



export type DBSong = {
    id: string;
    title: string;
    artist: string;
    durationms: number;
    thumbnail: string;
    video_id: string;
}




export type Playlist = {
    title: string;
    id: string;
    songs: DBSong[];
    count: number;
}


type playlistInit = Playlist[]

const playlistInit: playlistInit = []
const PlaylistContext = createContext(playlistInit)
//@ts-ignore
const PlaylistUpdateContext = createContext((newState: playlistInit) => { })





type likedSongInfoInit = DBSong[];
const likedSongInfoInit: likedSongInfoInit = []


const LikedSongInfoContext = createContext(likedSongInfoInit)
//@ts-ignore
const LikedSongInfoUpdateContext = createContext((newState: likedSongInfoInit) => { })




type likedSongsInit = Set<string>;




const likedSongsinit: likedSongsInit = new Set()
// global store for all liked songs
const LikedSongsContext = createContext(likedSongsinit);
//@ts-ignore
const LikedSongsUpdateContext = createContext((newState: likedSongsInit) => { })

export type queue = {
    songs: SongInfo[],
    index: number,
}

const queueInit: queue = {
    songs: [],
    index: 0
};

const QueueContext = createContext(queueInit);
//@ts-ignore
const QueueUpdateContext = createContext((newState: queue) => { });


export function qCtx() {
    return useContext(QueueContext);
}
export function setQCtx() {
    return useContext(QueueUpdateContext);
}

export function likedCtx() {
    return useContext(LikedSongsContext);
}
export function setLikedCtx() {
    return useContext(LikedSongsUpdateContext);
}

export function likedInfoCtx() {
    return useContext(LikedSongInfoContext)
}

export function setLikedInfoCtx() {
    return useContext(LikedSongInfoUpdateContext)
}

export function plCtx() {
    return useContext(PlaylistContext)
}

export function setPlCtx() {
    return useContext(PlaylistUpdateContext)
}

export function CurrentSongCtx() {
    return useContext(CurrentSongContext)
}

export function setCurentSongCtx() {
    return useContext(CurrentSongUpdateContext)
}

export function GlobalContextProvider(props: PropsWithChildren) {
    const { children } = props;
    const [currentSong, setCurrentSong] = useState(currentSongInit)
    const [liked, setLiked] = useState(likedSongsinit)
    const [queue, setQueue] = useState(queueInit);
    const [likedInfo, setLikedInfo] = useState(likedSongInfoInit);
    const [pls, setPls] = useState(playlistInit);
    function updateQueue(newState: queue) {
        setQueue(newState);
    }
    function updateLiked(newState: likedSongsInit) {
        setLiked(newState)
    }
    function updateCurrentSong(newState: CurrentSongInit) {
        setCurrentSong(newState)
    }
    function updateLikedInfo(newState: likedSongInfoInit) {
        setLikedInfo(newState);
    }
    function updatePls(newState: playlistInit) {
        setPls(newState)
    }

    return (
        <LikedSongInfoContext.Provider value={likedInfo}>
            <LikedSongInfoUpdateContext.Provider value={(newState: likedSongInfoInit) => { updateLikedInfo(newState) }}>
                <LikedSongsContext.Provider value={liked}>
                    <LikedSongsUpdateContext.Provider value={(newState: likedSongsInit) => { updateLiked(newState) }}>
                        <PlaylistContext.Provider value={pls}>
                            <PlaylistUpdateContext.Provider value={(newState: playlistInit) => { updatePls(newState) }}>
                                <QueueContext.Provider value={queue}>
                                    <QueueUpdateContext.Provider value={(newState: queue) => { updateQueue(newState) }}>
                                        <CurrentSongContext.Provider value={currentSong}>
                                            <CurrentSongUpdateContext.Provider value={(newState: CurrentSongInit) => { updateCurrentSong(newState) }}>
                                                {children}
                                            </CurrentSongUpdateContext.Provider>
                                        </CurrentSongContext.Provider>
                                    </QueueUpdateContext.Provider>
                                </QueueContext.Provider>
                            </PlaylistUpdateContext.Provider>
                        </PlaylistContext.Provider>
                    </LikedSongsUpdateContext.Provider>
                </LikedSongsContext.Provider>
            </LikedSongInfoUpdateContext.Provider>
        </LikedSongInfoContext.Provider>
    )
}