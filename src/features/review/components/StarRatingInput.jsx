import React, { useState } from "react";
import { StarFilled } from "@ant-design/icons";

const StarRatingInput = ({ value = 0, onChange, readOnly = false, size = 24 }) => {
    const [hoverValue, setHoverValue] = useState(0);
    const displayValue = hoverValue || value;

    return (
        <div className="flex items-center space-x-1">
            {[1, 2, 3, 4, 5].map((star) => {
                const isFilled = star <= displayValue;
                return (
                    <button
                        key={star}
                        type="button"
                        disabled={readOnly}
                        onClick={() => !readOnly && onChange && onChange(star)}
                        onMouseEnter={() => !readOnly && setHoverValue(star)}
                        onMouseLeave={() => !readOnly && setHoverValue(0)}
                        className={`transition-transform duration-150 ${
                            !readOnly ? "hover:scale-110 focus:outline-none cursor-pointer" : "cursor-default"
                        }`}
                        style={{ border: 0, background: "none", padding: 2 }}
                    >
                        <StarFilled
                            style={{
                                fontSize: size,
                                color: isFilled ? "#faad14" : "#d9d9d9",
                                transition: "color 0.2s"
                            }}
                        />
                    </button>
                );
            })}
        </div>
    );
};

export default StarRatingInput;
