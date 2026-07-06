export const buildSearchQuery = (params) => {

    return Object.fromEntries(

        Object.entries(params)
            .filter(([_, value]) => {

                if (value === null) return false;
                if (value === "") return false;
                if (value === undefined) return false;

                return true;

            })

    );

};