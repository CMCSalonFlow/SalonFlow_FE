import { useState } from "react";

import { searchBranchesApi } from "../api/searchApi";

export default function useBranchSearch() {
    const [loading, setLoading] = useState(false);
    const [branches, setBranches] = useState([]);
    const [cursor, setCursor] = useState(null);
    const [hasNext, setHasNext] = useState(false);
    const search = async (params) => {
        setLoading(true);

        try {
            const response =
                await searchBranchesApi(params);
            setBranches(response.items);
            setCursor(response.nextCursor);
            setHasNext(
                response.nextCursor != null
            );

        }
        finally {
            setLoading(false);
        }

    };

    const loadMore = async (params) => {

        if (!cursor) return;

        setLoading(true);
        try {
            const response =
                await searchBranchesApi({

                    ...params,

                    cursor

                });

            setBranches(prev => [

                ...prev,

                ...response.items

            ]);
            setCursor(
                response.nextCursor
            );
            setHasNext(
                response.nextCursor != null
            );
        }
        finally {
            setLoading(false);
        }
    };

    return {
        loading,
        branches,
        cursor,
        hasNext,
        search,
        loadMore
    };
}