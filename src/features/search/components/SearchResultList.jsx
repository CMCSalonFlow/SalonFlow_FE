import {
    Spin,
    Button
} from "antd";

import SearchResultCard
from "./SearchResultCard";

import EmptySearch
from "./EmptySearch";

export default function SearchResultList({

    items,

    loading,

    hasNext,

    onLoadMore

}) {

    if (
        !loading &&
        items.length === 0
    ) {
        return <EmptySearch />;
    }

    return (

        <Spin spinning={loading}>

            {
                items.map(item => (

                    <SearchResultCard
                        key={
                            item.branchId
                        }
                        item={item}
                    />

                ))
            }

            {
                hasNext &&
                (
                    <Button
                        block
                        onClick={onLoadMore}
                    >
                        Xem thêm
                    </Button>
                )
            }

        </Spin>

    );

}