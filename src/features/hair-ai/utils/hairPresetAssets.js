/**
 * Preset data for Hair Colors and Hairstyles used in TikTok-style AR Virtual Try-On
 */

export const HAIR_COLOR_PRESETS = [
    {
        id: "natural_black",
        name: "Đen Tự Nhiên",
        hex: "#1a1a1a",
        hsl: { h: 0, s: 0, l: 10 },
        blendMode: "multiply",
        opacity: 0.65,
        shine: 0.3,
        description: "Màu đen truyền thống bóng mượt, phù hợp mọi tông da.",
        badge: "Cơ bản"
    },
    {
        id: "espresso_brown",
        name: "Nâu Cacao Espresso",
        hex: "#3d2314",
        hsl: { h: 22, s: 51, l: 16 },
        blendMode: "soft-light",
        opacity: 0.75,
        shine: 0.4,
        description: "Nâu trầm ấm thanh lịch, tôn da sáng nhẹ nhàng.",
        badge: "Bán chạy"
    },
    {
        id: "rose_gold",
        name: "Hồng Rose Gold TikTok",
        hex: "#e89999",
        hsl: { h: 0, s: 64, l: 75 },
        blendMode: "color",
        opacity: 0.7,
        shine: 0.6,
        description: "Filter hồng pastel lấp lánh đang cực hot trên TikTok.",
        badge: "Trending TikTok"
    },
    {
        id: "platinum_silver",
        name: "Bạch Kim Platinum",
        hex: "#f1f5f9",
        hsl: { h: 215, s: 20, l: 92 },
        blendMode: "color",
        opacity: 0.85,
        shine: 0.7,
        description: "Tông bạch kim sáng thời thượng, chuẩn filter TikTok.",
        badge: "Trending TikTok"
    },
    {
        id: "copper_amber",
        name: "Cam Đồng Amber",
        hex: "#c86428",
        hsl: { h: 23, s: 67, l: 47 },
        blendMode: "soft-light",
        opacity: 0.8,
        shine: 0.5,
        description: "Tông rực rỡ nổi bật, mang lại cảm giác năng động, cá tính.",
        badge: "Nổi bật"
    },
    {
        id: "burgundy_red",
        name: "Đỏ Rượu Burgundy",
        hex: "#800020",
        hsl: { h: 345, s: 100, l: 25 },
        blendMode: "soft-light",
        opacity: 0.75,
        shine: 0.5,
        description: "Đỏ rượu vang quý phái, làm nổi bật đường nét khuôn mặt.",
        badge: "Sang trọng"
    },
    {
        id: "smoky_ash_blue",
        name: "Xanh Khói Smoky Ash",
        hex: "#4a6572",
        hsl: { h: 200, s: 21, l: 37 },
        blendMode: "color",
        opacity: 0.75,
        shine: 0.6,
        description: "Sắc xanh ánh khói độc đáo, hiệu ứng TikTok filter lung linh.",
        badge: "Cực chất"
    },
    {
        id: "emerald_green",
        name: "Xanh Rêu Emerald",
        hex: "#2e6f40",
        hsl: { h: 136, s: 41, l: 31 },
        blendMode: "soft-light",
        opacity: 0.7,
        shine: 0.5,
        description: "Tông rêu quyến rũ, cực kỳ hợp xu hướng phong cách Hàn Quốc.",
        badge: "Hàn Quốc"
    },
    {
        id: "honey_blonde",
        name: "Vàng Mật Ong Honey",
        hex: "#d4af37",
        hsl: { h: 46, s: 65, l: 52 },
        blendMode: "soft-light",
        opacity: 0.75,
        shine: 0.6,
        description: "Vàng ấm áp ngọt ngào, tôn làn da trắng mịn.",
        badge: "Tự nhiên"
    },
    {
        id: "neon_violet",
        name: "Tím Ánh Kim Violet",
        hex: "#8a2be2",
        hsl: { h: 271, s: 76, l: 53 },
        blendMode: "color",
        opacity: 0.7,
        shine: 0.65,
        description: "Tím cyberpunk nổi bật cá tính khi chụp hình filter.",
        badge: "Cyberpunk"
    }
];

export const HAIRSTYLE_PRESETS = [
    {
        id: "layered_bob",
        name: "Layered Bob Nữ",
        gender: "WOMEN",
        tags: ["Nữ", "Mặt Tròn", "Mặt Xoan"],
        scaleRatio: 1.45,
        offsetYRatio: -0.32,
        description: "Tóc Bob tỉa layer ôm sát khuôn mặt, tạo sự thon gọn và nữ tính.",
        iconSvg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 55C20 30 32 12 50 12C68 12 80 30 80 55C80 75 75 88 72 90C65 72 63 60 50 60C37 60 35 72 28 90C25 88 20 75 20 55Z" fill="#3b82f6" opacity="0.85"/>
            <path d="M25 45C22 25 35 15 50 15C65 15 78 25 75 45C70 30 60 22 50 22C40 22 30 30 25 45Z" fill="#60a5fa"/>
        </svg>`
    },
    {
        id: "curtain_bangs",
        name: "Curtain Bangs Hàn Quốc",
        gender: "WOMEN",
        tags: ["Nữ", "Mặt Dài", "Mặt Trái Tim"],
        scaleRatio: 1.5,
        offsetYRatio: -0.36,
        description: "Mái bay Hàn Quốc tạo nét thanh thoát bồng bềnh quyến rũ.",
        iconSvg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 60C18 30 30 10 50 10C70 10 82 30 82 60C82 85 75 92 70 92C65 70 58 45 50 45C42 45 35 70 30 92C25 92 18 85 18 60Z" fill="#ec4899" opacity="0.85"/>
        </svg>`
    },
    {
        id: "pixie_cut",
        name: "Pixie Cut Cá Tính",
        gender: "WOMEN",
        tags: ["Nữ", "Mặt Vuông", "Cá tính"],
        scaleRatio: 1.35,
        offsetYRatio: -0.28,
        description: "Tóc ngắn Pixie trẻ trung, sang chảnh và đầy phá cách.",
        iconSvg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M25 50C22 32 34 15 50 15C66 15 78 32 75 50C72 40 62 30 50 30C38 30 28 40 25 50Z" fill="#8b5cf6" opacity="0.85"/>
        </svg>`
    },
    {
        id: "undercut_fade",
        name: "Undercut Fade Nam",
        gender: "MEN",
        tags: ["Nam", "Mặt Xoan", "Mặt Vuông"],
        scaleRatio: 1.38,
        offsetYRatio: -0.30,
        description: "Cắt sát 2 bên fade quyến rũ, phần trên vuốt phồng hiện đại.",
        iconSvg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M28 45C28 25 36 14 50 14C64 14 72 25 72 45C72 35 62 25 50 25C38 25 28 35 28 45Z" fill="#10b981" opacity="0.85"/>
        </svg>`
    },
    {
        id: "korean_perm",
        name: "Tóc Xoăn Wave Hàn Quốc",
        gender: "WOMEN",
        tags: ["Nữ", "Mặt Xoan", "Bồng Bềnh"],
        scaleRatio: 1.55,
        offsetYRatio: -0.38,
        description: "Sóng lơi quyến rũ, tôn đường nét nhẹ nhàng tự nhiên.",
        iconSvg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 65C15 30 30 8 50 8C70 8 85 30 85 65C85 92 76 96 70 96C64 80 60 55 50 55C40 55 36 80 30 96C24 96 15 92 15 65Z" fill="#f59e0b" opacity="0.85"/>
        </svg>`
    },
    {
        id: "textured_crop",
        name: "Textured Crop Nam",
        gender: "MEN",
        tags: ["Nam", "Mặt Dài", "Mặt Tròn"],
        scaleRatio: 1.36,
        offsetYRatio: -0.29,
        description: "Tỉa texture mái ngắn, trẻ trung năng động chuẩn style châu Âu.",
        iconSvg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M30 46C30 28 38 18 50 18C62 18 70 28 70 46C70 38 60 30 50 30C40 30 30 38 30 46Z" fill="#06b6d4" opacity="0.85"/>
        </svg>`
    },
    {
        id: "buzz_cut",
        name: "Buzz Cut Nam",
        gender: "MEN",
        tags: ["Nam", "Góc Cạnh", "Mạnh Mẽ"],
        scaleRatio: 1.25,
        offsetYRatio: -0.22,
        description: "Kiểu đầu đinh gọn gàng, nam tính, khoe trọn khuôn mặt.",
        iconSvg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M32 42C32 28 40 20 50 20C60 20 68 28 68 42C68 34 60 28 50 28C40 28 32 34 32 42Z" fill="#64748b" opacity="0.85"/>
        </svg>`
    }
];
