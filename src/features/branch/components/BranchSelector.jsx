import { Select } from "antd";
import { useEffect, useState } from "react";

import { useBranch } from "../hooks/useBranch";

export default function BranchSelector() {

    const {
        getMyBranches,
        switchBranch
    } = useBranch();

    const [branches, setBranches]
        = useState([]);

    const [currentBranchId, setCurrentBranchId]
        = useState(
            localStorage.getItem(
                "currentBranchId"
            )
        );

    useEffect(() => {

        loadBranches();

    }, []);

    const loadBranches =
        async () => {

            const data =
                await getMyBranches();

            setBranches(data);

            if (
                !currentBranchId &&
                data.length > 0
            ) {

                if (!currentBranchId && data.length > 0) {

                    localStorage.setItem(
                        "currentBranchId",
                        data[0].id
                    );

                    setCurrentBranchId(
                        data[0].id
                    );
                }
            }
        };

    return (
        <Select
            style={{
                width: 220
            }}
            value={
                currentBranchId
                    ? Number(currentBranchId)
                    : undefined
            }
            onChange={switchBranch}
            options={
                branches.map(
                    branch => ({
                        value: branch.id,
                        label: branch.name
                    })
                )
            }
        />
    );
}