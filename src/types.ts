export interface Profile {
    id: string;
    username: string;
    avatar_url?: string;
    full_name?: string;
    bio?: string;
    city?: string;
    state?: string;
    discord_handle?: string;
    psn_handle?: string;
    xbox_handle?: string;
    steam_handle?: string;
    riot_handle?: string;
}

export interface Match extends Profile {
    matched_at: string;
}

export interface Filters {
    minRespect: number;
    minCommunication: number;
    minHumor: number;
    minCollaboration: number;
}
