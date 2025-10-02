"use client";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ReactElement, Fragment, useState } from "react"
import { StarIcon as StarSolid } from "@heroicons/react/20/solid";
import { StarIcon as StarOutlined} from "@heroicons/react/24/outline";
import { authClient } from "../lib/auth-client";
import {User} from "better-auth";
import { useRouter } from "next/navigation";
import { useRateLimitedCallback } from "@tanstack/react-pacer";
import { notification } from "antd";

interface type {
  name: string,
  url: string
}
interface typeData {
  slot: number
  type: type
}
interface u extends User {
  favourites: string,
}
interface favouriteMutationData {
  pokemonId: number,
  favourited: boolean
}

function PokemonCard({ name, url, id }: {name: string, url: string, id: number}) {
  const [api, contextHolder] = notification.useNotification();
  const { data, error, isPending } = useQuery({
    queryKey: ["pokemon", id],
    queryFn: async()=> {
      const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`)
      return res.json();      
    }
  })

  const queryClient = useQueryClient();
  const session = useQuery({
    queryKey: ["getSession"],
    queryFn: async()=>{
      return authClient.getSession();
    },
    staleTime: 60*1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })

  const loggedin = (session.data?.data);
  const [favourite, setFavourite] = useState(false);

  const favouriteMutation = useMutation({
    mutationFn: async (mutationData: favouriteMutationData) => {
      let favourites: number[] = JSON.parse((session.data?.data?.user as u).favourites);

      if (mutationData.favourited) {
        favourites.push(mutationData.pokemonId);
      } else {
        favourites = favourites.filter(id => id !== mutationData.pokemonId);
      }

      await authClient.updateUser({
        favourites: JSON.stringify(favourites),
      } as any);

      await queryClient.invalidateQueries({ queryKey: ["getSession"] });
      return favourites;
    },
  });
  
  if (session.isPending) return "Loading...";
  
  if (loggedin && session.data?.data && (JSON.parse((session.data?.data.user as u).favourites) as Array<number>).includes(id)){
    if (!favourite) setFavourite(true);
  }


  const limiter = useRateLimitedCallback((mutationData: favouriteMutationData) => favouriteMutation.mutate(mutationData),{
    limit: 1,
    window: 1*1000
  })

  const toggleFavourite = () => {
    if (!loggedin) return;
    const success = limiter({ pokemonId: id, favourited: !favourite });
    if (success) {
      setFavourite(!favourite); // Instant client-side updating
    } else {
      api.error({
        message: <span className="text-gray-300">Couldn't favourite!</span>,
        description: <span className="text-gray-300">You've been rate limited, please wait before trying again!</span>,
        placement: "topRight",
        className: 'bg-blue-500'
      })
    }
  }

  return (
    <div>
      {contextHolder}
      <div className="w-full h-20 hover:scale-102 snap-normal rounded-md outline outline-sky-500 relative bg-blue-500/50">
        <div className="flex gap-3 p-2 relative">
          <img alt={name} src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`} className="w-16 h-16 bg-sky-500/40 rounded-sm outline outline-sky-500/80"/>
          <div className="flex flex-col">
            <h1 className="font-bold">{name}</h1>
            <div className="flex w-full">
              { isPending ? (
                <h1 className="text-sm">Loading...</h1>
              ) : error ? (
                <h1 className="text-sm">Couldn't grab details...</h1>
              ) : data && (
                <div>
                  <h1 className="text-sm">⚖️ Weight: {data.weight/10}kg</h1>
                  <span className="text-sm flex gap-1">🧬 Type: {data.types.map((s: typeData) => <Fragment key={s.type.name+"-"+id}>
                    <h1>
                      {s.type.name == "bug" && "🐛"}
                      {s.type.name == "dark" && "🌑"}
                      {s.type.name == "dragon" && "🐉"}
                      {s.type.name == "electric" && "⚡"}
                      {s.type.name == "fairy" && "🧚"}
                      {s.type.name == "fighting" && "🥊"}
                      {s.type.name == "fire" && "🔥"}
                      {s.type.name == "flying" && "🕊️"}
                      {s.type.name == "ghost" && "👻"}
                      {s.type.name == "grass" && "🌱"}
                      {s.type.name == "ground" && "🌍"}
                      {s.type.name == "ice" && "❄️"}
                      {s.type.name == "normal" && "🐄"}
                      {s.type.name == "poison" && "☠️"}
                      {s.type.name == "psychic" && "🧠"}
                      {s.type.name == "rock" && "🪨"}
                      {s.type.name == "steel" && "⚙️"}
                      {s.type.name == "water" && "💧"}
                      {s.type.name}
                    </h1>
                  </Fragment>)}</span>
                </div>
              )}
            </div>
            { favourite ? (
              <StarSolid className="absolute m-2 top-0 right-0 size-5 hover:scale-105 fill-yellow-500 hover:fill-yellow-600" onClick={toggleFavourite}/>
            ) : 
              <StarOutlined className="absolute m-2 top-0 right-0 size-5 hover:scale-105 hover:fill-yellow-600/50" onClick={toggleFavourite}/>
            }
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PokemonPage(): ReactElement {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<any[] | null>(null);

  const fetchPokemon = async ({ pageParam }: { pageParam: string }) => {
    const res = await fetch(pageParam)
    return res.json();
  }
  
  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status
  } = useInfiniteQuery({
    queryKey: ["pokedex"],
    queryFn: fetchPokemon,
    initialPageParam: "https://pokeapi.co/api/v2/pokemon/",
    getNextPageParam: (lastPage) => lastPage.next
  })

  const session = useQuery({
    queryKey: ["getSession"],
    queryFn: async()=> {
      return authClient.getSession();
    },
    staleTime: 60*1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })

  const queryClient = useQueryClient();
  const router = useRouter();
  const loggedin = (session.data?.data);

  if (session.isPending) return <p>Loading...</p>;

  const handleSearch = async () => {
    if (!search.trim()) {
      setResults(null);
      return;
    }
    try {
      if (!isNaN(Number(search))) {
        const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${search}`);
        if (!res.ok) throw new Error("Not found");
        const data = await res.json();
        setResults([{ name: data.name, url: `https://pokeapi.co/api/v2/pokemon/${data.id}/`, id: data.id }]);
        return;
      }

      let res = await fetch(`https://pokeapi.co/api/v2/pokemon/${search.toLowerCase()}`);
      if (res.ok) {
        const data = await res.json();
        setResults([{ name: data.name, url: `https://pokeapi.co/api/v2/pokemon/${data.id}/`, id: data.id }]);
        return;
      }

      res = await fetch(`https://pokeapi.co/api/v2/type/${search.toLowerCase()}`);
      if (res.ok) {
        const data = await res.json();
        const pokemons = data.pokemon.map((p: any) => {
          const id = parseInt(p.pokemon.url.split("/").filter(Boolean).pop());
          return { name: p.pokemon.name, url: p.pokemon.url, id };
        });
        setResults(pokemons);
        return;
      }

      setResults([]);
    } catch (err) {
      setResults([]);
    }
  }

  return (
    <div className="flex justify-center items-center bg-slate-900 w-screen h-screen">
      <div className="flex flex-col justify-center items-center w-full h-full">
        
        <div className="w-[25rem] p-4 flex gap-2">
          <input
            type="text"
            value={search}
            onChange={(e)=>setSearch(e.target.value)}
            placeholder="Search by name, id, or type..."
            className="flex-1 p-2 rounded-md outline outline-sky-500 bg-slate-800 text-white"
          />
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-blue-500 rounded-md font-bold"
          >
            Search
          </button>
        </div>

        <div className={`
          relative flex flex-col gap-2 h-160 w-80 overflow-auto snap-x rounded-lg p-5 bg-blue-900/90
          ${ isFetching || isFetchingNextPage ? "inset-shadow-sm inset-shadow-gray-900" : ""} 
          outline outline-sky-500`}
          onScroll={(event)=>{ 
            if (!results) {
              const target = event.currentTarget; 
              if ((target.scrollTop + target.clientHeight >= target.scrollHeight -3) && (!isFetching && !isFetchingNextPage)) {
                fetchNextPage();
              }
            }
          }}>

          {results ? (
            results.length > 0 ? results.map((pokemon) => (
              <PokemonCard key={pokemon.id} name={pokemon.name} url={pokemon.url} id={pokemon.id}/>
            )) : <p>No results found.</p>
          ) : data ? (
            data.pages.map((group, i) => (
              <Fragment key={i}>
                {group.results.map((pokemon: { name: string, url: string }, j:number) => {
                  const id = Number(pokemon.url.split("/").filter(Boolean).pop());
                  return <PokemonCard key={id} name={pokemon.name} url={pokemon.url} id={id}/>
                })}
              </Fragment>
            ))
          ) : <h1>Couldn't find pokemon!</h1>}
        </div>
      </div>

      { loggedin ? (
        <button className="absolute font-bold top-0 right-0 m-5 rounded-lg bg-blue-500 p-2 cursor-pointer" onClick={()=>{
          authClient.signOut();
          queryClient.invalidateQueries({ queryKey: ["getSession"] })
        }}>Sign Out</button>
      ) : (
        <button className="absolute font-bold top-0 right-0 m-5 rounded-lg bg-blue-500 p-2 cursor-pointer" onClick={()=>{
          router.push('/auth/signin')
        }}>Sign In</button>
      )}
    </div>
  )
}
