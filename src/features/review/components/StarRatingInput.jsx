import React, { useState } from "react";
import { Star } from "lucide-react";

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
                            !readOnly ? "hover:scale-115 focus:outline-none cursor-pointer" : "cursor-default"
                        }`}
                    >
                        <Star
                            size={size}
                            className={`transition-colors duration-150 ${
                                isFilled
                                    ? "text-amber-400 fill-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]"
                                    : "text-gray-300 dark:text-gray-600 fill-transparent"
                            }`}
                        />
                    </button>
                );
            })}
        </div>
    );
};

export default StarRatingInput;
