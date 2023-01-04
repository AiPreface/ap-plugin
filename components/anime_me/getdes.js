/*
 * @Author: 渔火Arcadia  https://github.com/yhArcadia
 * @Date: 2022-12-23 15:13:31
 * @LastEditors: 渔火Arcadia
 * @LastEditTime: 2023-01-04 16:04:38
 * @FilePath: \Yunzai-Bot\plugins\ap-plugin\components\anime_me\getdes.js
 * @Description: 随机获取一组“二次元的我”描述词
 * 
 * Copyright (c) 2022 by 渔火Arcadia 1761869682@qq.com, All Rights Reserved. 
 */


/**随机获取一组“二次元的我”描述词
 * @return {object} { ch: 中文描述词, en: 英文tags }
 */
export function getdsc(qq) {
    const tag_data = {
        "正面常用": {
            "高质量": "best quality,",
            "高细节": "highly detailed,",
            "杰作": "masterpiece,",
            "超细节": "ultra-detailed,",
            "插图": "illustration,"
        },
        "发色": {
            "亮棕": "light brown hair, light brown ",
            "双": "two-tone hair, two-tone ",
            "彩": "multicolored hair, multicolored ",
            "白": "white hair, white ",
            "金": "blonde hair, blonde ",
            "银": "silver hair, silver ",
            "灰": "grey hair, grey ",
            "紫": "purple hair, purple ",
            "红": "red hair, red ",
            "黄": "yellow hair, yellow ",
            "绿": "green hair, green ",
            "蓝": "blue hair, blue ",
            "黑": "black hair, black ",
            "棕": "brown hair, brown "
        },
        "头发": {
            "短发": "short hair,",
            "卷发": "curly_hair,",
            "长发": "long hair,",
            "马尾": "pony-tail,",
            "双马尾": "twintails,",
            "挑染": "streaked hair,",
            "灰色渐变发型": "grey gradient hair,",
            "高马尾": "high ponytail,",
            "马尾编发": "braided ponytail ,",
            "马尾辫": "ponytail,",
            "短马尾": "short_ponytail,",
            "双辫子": "twin_braids,",
            "中发": "medium hair,",
            "超长发": "very long hair,",
            "辫子刘海": "braided bangs,",
            "侧扫刘海": "swept bangs,",
            "眼间头发": "hair between eyes,",
            "妹妹切": "bob cut,",
            "公主切": "hime_cut,",
            "交叉刘海": "crossed bangs,",
            "刘海": "bangs,",
            "齐刘海": "blunt bangs,",
            "翼状头发": "hair wings,",
            "长刘海": "long bangs,",
            "蓬发": "disheveled hair,",
            "波浪形头发": "wavy hair,",
            "收拢的发型": "hair in takes,",
            "粉色花的发型": "hair pink flowers,",
            "呆毛": "ahoge,",
            "多根呆毛": "antenna hair,",
            "侧马尾": "Side ponytail,",
            "露额头发型": "forehead,",
            "钻头公主卷": "drill hair,",
            "包子头发型": "hair bun,",
            "俩包子头发型": "double_bun,",
            "凌乱发型": "messy_hair,"
        },
        "眼色": {
            "白": "white eyes,white eyes,white pupils,white pupils,",
            "金": "blonde eyes,blonde eyes, blonde pupils,blonde pupils, ",
            "银": "silver eyes,silver eyes,silver pupils,silver pupils,",
            "灰": "grey eyes,grey eyes,grey pupils,grey pupils, ",
            "紫": "purple eyes,purple eyes,purple pupils,purple pupils,",
            "红": "red eyes,red eyes,red pupils,red pupils,",
            "黄": "yellow eyes,yellow eyes,yellow pupils,yellow pupils,",
            "绿": "green eyes,green eyes,green pupils,green pupils,",
            "蓝": "blue eyes,blue eyes,blue pupils,blue pupils,",
            "黑": "black eyes,black eyes,black pupils,black pupils,",
            "棕": "brown eyes,brown eyes,brown pupils,brown pupils,"
        },
        "衣服颜色": {
            "亮棕": "light brown ",
            "双": "two-tone ",
            "彩": "multicolored ",
            "白": "white ",
            "金": "blonde  ",
            "银": "silver ",
            "灰": "grey  ",
            "紫": "purple ",
            "红": "red ",
            "黄": "yellow ",
            "绿": "green ",
            "蓝": "blue ",
            "黑": "black ",
            "棕": "brown "
        },
        "衣服样式": {
            "1": "",
            "2": "",
            "3": "",
            "4": "",
            "5": "",
            "格子花纹": "tartan ",
            "11": "",
            "12": "",
            "13": "",
            "14": "",
            "15": "",
            "露单肩": "off_shoulder ",
            "21": "",
            "22": "",
            "23": "",
            "24": "",
            "25": "",
            "露双肩": "bare_shoulders ",
            "31": "",
            "32": "",
            "33": "",
            "34": "",
            "35": "",
            "横条花纹的": "striped ",
            "61": "",
            "62": "",
            "63": "",
            "64": "",
            "65": "",
            "点状花纹的": "polka_dot ",
            "71": "",
            "72": "",
            "73": "",
            "74": "",
            "75": "",
            "皱边的": "frills ",
            "81": "",
            "82": "",
            "83": "",
            "84": "",
            "85": "",
            "花边": "lace ",
        },
        "衣服": {
            "晚礼服": "evening dress,",
            "短裙": "Skirt,",
            "长裙": "Long skirt,",
            "水手服": "shorts under skirt,",
            "JK": "JK,",
            "黑色丝袜": "black silk stocking,",
            "白色丝袜": "white silk stocking,",
            "西装": "suit,",
            "湿衣服": "wet clothes,",
            "比基尼": "bikini,",
            "领子": "sailor collar,",
            "帽子": "hat,",
            "衬衫": "shirt,",
            "有领衬衣": "collared shirt ,",
            "学校制服": "school uniform,",
            "日本学生服": "seifuku,",
            "职场制服": "business_suit,",
            "夹克": "jacket,",
            "火焰纹章军服": "garreg mach monastery uniform,",
            "礼服长裙": "revealing dress,",
            "礼服": "pink lucency full dress,",
            "露出胸口部分的连衣裙": "cleavage dress,",
            "无袖连衣裙": "sleeveless dress,",
            "白色连衣裙": "whitedress,",
            "婚纱": "wedding_dress,",
            "水手连衣裙": "Sailor dress,",
            "毛衣裙": "sweater dress,",
            "罗纹毛衣": "ribbed sweater,",
            "毛衣夹克": "sweater jacket,",
            "工装服": "dungarees,",
            "棕色开襟衫（外套）": "brown cardigan ,",
            "连帽衫，卫衣": "hoodie ,",
            "长袍": "robe,",
            "斗篷": "cape,",
            "羊毛衫": "cardigan,",
            "围裙": "apron,",
            "哥特风格": "gothic,",
            "洛丽塔风格": "lolita_fashion,",
            "哥特洛丽塔风格": "gothic_lolita,",
            "西部风格": "western,",
            "日本女生运动短裤": "buruma,",
            "运动服": "gym_uniform,",
            "女用背心": "tank_top,",
            "裁剪短夹克": "cropped jacket ,",
            "运动胸罩": "black sports bra ,",
            "漏脐装": "crop top,",
            "睡衣": "pajamas,",
            "和服": "japanese_clothes,",
            "衣带和服用": "obi,",
            "网眼上衣": "mesh,",
            "无袖上衣": "sleeveless shirt,",
            "袖肩分离装": "detached_sleeves,",
            "白色灯笼裤": "white bloomers,",
            "高腰腿裤": "high - waist shorts,",
            "百褶裙": "pleated_skirt,",
            "裙子": "skirt,",
            "迷你裙": "miniskirt,",
            "热裤": "short shorts,",
            "夏日长裙": "summer_dress,",
            "灯笼裤": "bloomers,",
            "短裤": "shorts,",
            "自行车短裤": "bike_shorts,",
            "海豚短裤": "dolphin shorts,",
            "腰带": "belt,",
            // "吊索比基尼": "sling bikini,",
            // "上身比基尼": " bikini top only ,",
            // "侧边系带比基尼下装": "side - tie bikini bottom,",
            // "系带式比基尼": "side-tie_bikini,",
            "褶边比基尼": "friled bikini,",
            // "比基尼内衣": " bikini under clothes,",
            "泳装": "swimsuit,",
            "学校泳衣": "school swimsuit,",
            "连体泳衣": "one-piece swimsuit,",
            "竞技泳衣": "competition swimsuit,",
            "死库水": "Sukumizu,",
            "褶边文胸": "frilled bra ,",
            "缠胸布": "sarashi,",
            "胸衣": "bustier,",
            "吊带胸衣": "chemise,",
            "高腰内裤": "string_panties,",
            // "丁字裤": "thong,",
            "日式丁字裤": "fundoshi,",
            "女用贴身内衣裤": "lingerie,"
        },
        "鞋子颜色": {
            "亮棕": "light brown ",
            "双": "two-tone ",
            "彩": "multicolored ",
            "白": "white ",
            "金": "blonde  ",
            "银": "silver ",
            "灰": "grey  ",
            "紫": "purple ",
            "红": "red ",
            "黄": "yellow ",
            "绿": "green ",
            "蓝": "blue ",
            "黑": "black ",
            "棕": "brown "
        },
        "鞋子": {
            "鞋子": "shoes,",
            "靴子": "boots,",
            "乐福鞋": "loafers,",
            "高跟鞋": "high heels,",
            "系带靴": "cross-laced_footwear,",
            "玛丽珍鞋": "mary_janes,",
            "女式学生鞋": "uwabaki,",
            "拖鞋": "slippers,",
            "马靴": "knee_boots,",
            "连裤袜": "pantyhose,",
            "大腿连裤袜": "thighband pantyhose,",
            "连腰吊带袜": "garter_belt,",
            "吊带袜": "garter straps,",
            "短袜": "socks,",
            "横条袜": "striped_socks,",
            "泡泡袜": "loose_socks,",
            "裹腿": "legwear,",
            "黑色紧身裤": "black leggings ,",
            "裤袜": "leggings ,",
            "网袜": "fishnets,",
            "渔网袜": "fishnet_pantyhose,",
            "长袜": "kneehighs,",
            "丝袜": "stockings,",
            "过膝袜": "thighhighs,",
            "条纹过膝袜": "striped_thighhighs,",
            "白色过膝袜": "white_thighhighs,",
            "损坏了的过膝袜": "torn_thighhighs,",
            "日式厚底短袜": "tabi,",
            "蕾丝镶边紧身裤": "lace-trimmed legwear,",
            "腿部花边环": "leg_garter,",
            "腿部系带": "ankle_lace-up,",
            "大腿系带": "thigh strap,",
            "短裤下的紧身裤": "legwear under shorts,"
        },
        "装饰颜色": {
            "亮棕": "light brown ",
            "双": "two-tone ",
            "彩": "multicolored ",
            "白": "white ",
            "金": "blonde  ",
            "银": "silver ",
            "灰": "grey  ",
            "紫": "purple ",
            "红": "red ",
            "黄": "yellow ",
            "绿": "green ",
            "蓝": "blue ",
            "黑": "black ",
            "棕": "brown "
        },
        "装饰": {
            "光环": "halo,",
            "迷你礼帽": "mini_top_hat,",
            "贝雷帽": "beret,",
            "兜帽": "hood,",
            "护士帽": "nurse cap,",
            "皇冠": "tiara,",
            "鬼角": "oni horns,",
            "恶魔角": "demon horns,",
            "发带": "hair_ribbon,",
            "花丝带": "flower ribbon,",
            "发卡": "hairband,",
            "发夹": "hairclip,",
            "发花": "hair_flower,",
            "头饰": "hair_ornament,",
            "蝴蝶结": "bowtie,",
            "蝴蝶结发饰": "hair_bow,",
            "女仆头饰": "maid_headdress,",
            "服装饰品头部饰品": "bow,",
            "发饰": "hair ornament,",
            "心形": "heart hair ornament,",
            "创可贴": "bandaid,",
            "锥形发髻": "cone hair bun,",
            "双发髻": "double bun,",
            "半无框的眼镜": "semi-rimless eyewear,",
            "太阳镜": "sunglasses,",
            "风镜": "goggles,",
            "眼罩独眼": "eyepatch,",
            "黑色眼罩": "black blindfold,",
            "耳机": "headphones,",
            "面纱": "veil,",
            "口罩": "mouth mask,",
            "眼镜": "glasses,",
            "耳环": "earrings,",
            "首饰": "jewelry,",
            "铃铛": "bell,",
            "颈带": "ribbon_choker,",
            "颈部饰品": "black choker ,",
            "项链": "necklace,",
            "耳机套脖子上": "headphones around neck,",
            "项圈": "collar,",
            "水手领": "sailor_collar,",
            "领巾": "neckerchief,",
            "领带": "necktie,",
            "十字架": "cross necklace,",
            "吊坠": "pendant,",
            "围巾": "scarf,",
            "臂章": "armband,",
            "臂环": "armlet,",
            "臂带": "arm strap,",
            "肘部手套": "elbow gloves ,",
            "露指手套": "half gloves ,",
            "手镯": "bracelet,",
            "手套": "gloves,",
            "五指手套": "fingerless gloves,",
            "锁链": "chains,",
            "手链": "shackles,",
            "手铐": "handcuffs,",
            "手表": "wristwatch,",
            "腕带": "wristband,",
            "腕饰": "wrist_cuffs,",
            "拿着书": "holding book,",
            "拿着剑": "holding sword,",
            "球拍": "tennis racket,",
            "手杖": "cane,",
            "双肩包": "backpack,",
            "书包": "school bag ,",
            "肩背书包": "satchel,",
            "手机": "smartphone, "
        },
        "胸": {
            "平胸": "flat breast,",
            "小胸": "small breast,",
            "中等胸部": "medium breast,",
            "大胸": "big breast,",
            // "巨乳": "huge breast"
        },
        "类型": {
            //加几个男性选项 
            "小女孩": "little girl,",
            "小男孩": "little boy,male,",
            "成年男性": "man,Adult male,male,man,",
            "年轻男性": "young boy,male,boy,",
            "正太": "shota,male,",
            "萝莉": "loli,",
            "可爱": "kawaii,",
            "雌小鬼": "mesugaki,",
            "可爱的女孩": "adorable girl,",
            "美少女": "bishoujo,",
            "辣妹": "gyaru,",
            // "姐妹": "sisters,",
            "大小姐": "ojousama,",
            "成熟女性": "mature female,",
            "成熟": "mature,",
            "痴女": "female pervert,",
            "熟女": "milf,"
        },
        "身份": {
            "女王": "queen,",
            "学生": "student,",
            "医生": "doctor,",
            "护士": "nurse,",
            "警察": "police,",
            "士兵": "soldier,",
            "骑士": "knight,",
            "女仆": "housemaid,",
            "天使": "angel,",
            "啦啦队": "cheerleader,",
            "伪娘": "trap,",
            "恶魔": "devil,",
            "人偶": "doll,",
            "妖精": "elf,",
            "小精灵": "fairy,",
            "女人": "female,",
            "兽人": "furry,",
            "半兽人": "orc,",
            "女巨人": "giantess,",
            "后宫": "harem,",
            "偶像": "idol,",
            "兽耳萝莉模式": "kemonomimi_mode,",
            "魔法少女": "magical_girl,",
            "男人": "male,",
            "美人鱼": "mermaid,",
            "巫女": "miko,",
            "迷你女孩": "minigirl,",
            "怪物": "monster,",
            "忍者": "ninja,",
            "非人": "no_humans,",
            "修女": "nun,",
            "空姐": "stewardess,",
            "吸血鬼": "vampire,",
            "女服务员": "waitress,",
            "女巫": "witch,",
            "搞基": "yaoi,",
            "油库里": "yukkuri_shiteitte_ne,",
            "百合": "yuri,",
            "jojo": "jojo"
        },
        "表情": {
            "微笑": "smirk,",
            "诱惑笑": "seductive smile,",
            "露齿而笑": "grin,",
            "笑": "laughing,",
            "牙": "teeth ,",
            "兴奋": "excited,",
            "害羞": "nose blush ,",
            "脸红": "blush,",
            "无表情": "expressionless,",
            "失神": "expressionless eyes,",
            "困": "sleepy,",
            "喝醉的": "drunk,",
            "哭": "crying with eyes open,",
            "悲伤的": "sad,",
            "别扭努嘴": "pout,",
            "叹气": "sigh,",
            "睁大眼睛": "wide eyed,",
            "生气": "angry,",
            "苦恼的": "annoyed,",
            "皱眉": "frown,",
            "严肃": "serious,",
            "鄙夷": "jitome,",
            "疯狂的": "crazy,",
            "黑化的": "dark_persona,",
            "得意": "smug,",
            "一只眼睛闭上": "one eye closed,",
            "半闭眼睛": "half-closed eyes,",
            "鼻血": "nosebleed,",
            "做鬼脸": "eyelid pull ,",
            "舌头": "tongue,",
            "吐舌": "tongue out,",
            "闭嘴": "closed mouth,",
            "张嘴": "open mouth,",
            "口红": "lipstick,",
            "尖牙": "fangs,",
            "咬紧牙关": "clenched teeth,",
            "ω猫嘴": ":3,",
            "向下吐舌头": ":p,",
            "向上吐舌头": ":q,",
            "不耐烦": ":t,",
            "杯型笑脸": ":d,",
            "下流的表情": "naughty_face,",
            "忍耐的表情": "endured_face,",
            "阿黑颜": "ahegao,",
            "血在脸上": "blood on face,",
            "唾液": "saliva,"
        },
        "二次元": {
            "食物在脸上（食物可替换）": "food on face,",
            "淡淡腮红": "light blush,",
            "有面纹": "facepaint,",
            "浓妆": "makeup ,",
            "可爱表情": "cute face,",
            "白色睫毛": "white colored eyelashes,",
            "长睫毛": "longeyelashes,",
            "白色眉毛": "white eyebrows,",
            "吊眼角": "tsurime,",
            "渐变眼": "gradient_eyes,",
            "垂眼角": "tareme,",
            "猫眼": "slit pupils ,",
            "异色瞳": "heterochromia ,",
            "水汪汪大眼": "aqua eyes,",
            "看你": "looking at viewer,",
            "盯着看": "eyeball,",
            "凝视": "stare,",
            "透过刘海看": "visible through hair,",
            "看旁边": "looking to the side ,",
            "收缩的瞳孔": "constricted pupils,",
            "符号形状的瞳孔": "symbol-shaped pupils ,",
            "爱心瞳孔": "heart-shaped pupils,",
            "眨眼": "wink ,",
            "眼下痣": "mole under eye,",
            "闭眼": "eyes closed,",
            "没鼻子": "no_nose,",
            "动物耳朵": "animal_ears,",
            "毛茸茸的动物耳朵": "animal ear fluff ,",
            "狐狸耳朵": "fox_ears,",
            "兔子耳朵": "bunny_ears,",
            "猫耳": "cat_ears,",
            "狗耳": "dog_ears,",
            "鼠耳": "mouse_ears,",
            "头发上耳朵": "hair ear,",
            "尖耳": "pointy ears,"
        },

        "基础动作": {
            "坐": "sitting,",
            "站": "stand,",
            "蹲着": "squat,",
            "趴": "grovel,",
            "躺": "lie,",
            "跳": "jump,",
            "跑": "run,",
            "走": "walk,",
            "飞": "fly,",
            "歪头": "head tilt,",
            "回头": "looking back,",
            "向下看": "looking down,",
            "向上看": "looking up,",
            "闻": "smelling,",
            "睡觉": "sleeping,",
            "洗澡": "bathing,"
        },
        "手动作": {
            "手放在嘴边": "hand_to_mouth,",
            "手放头旁边": "arm at side ,",
            "手放脑后": "arms behind head,",
            "手放后面": "arms behind back ,",
            "手放在自己的胸前": "hand on own chest,",
            "手交叉于胸前": "arms_crossed,",
            "手放臀": "hand on another's hip,",
            "单手插腰": "hand_on_hip,",
            "双手叉腰": "hands on hip,",
            "举手": "hands up ,",
            "伸懒腰": "stretch,",
            "举手露腋": "armpits,",
            "抓住": "grabbing,",
            "拿着": "holding,",
            "用手指做出笑脸": "fingersmile,",
            "拉头发": "hair_pull,",
            "撮头发": "hair scrunchie,",
            "手势": "w ,",
            "耶": "peace symbol ,",
            "翘大拇指": "thumbs_up,",
            "比出中指": "middle_finger,",
            "猫爪手势": "cat_pose,",
            "手枪手势": "finger_gun,",
            "嘘手势": "shushing,",
            "招手": "waving,",
            "敬礼": "salute,",
            "张手": "spread_arms,",

            "战斗姿态": "fighting_stance,",
            "翘臀姿势": "bent_over,",
            "掏耳勺": "mimikaki,",
            "四肢趴地": "all_fours,",
            "调整过膝袜": "adjusting_thighhigh,",

            "肩膀": "Bare shoulders,",
            "大腿": "Bare thigh,",
            "手臂": "Bare arms,",
            "肚脐": "Bare navel,"
        },
        "腿动作": {
            "二郎腿": "crossed_legs,",
            "抬一只脚": "leg_lift,",
            "抬两只脚": "legs_up,",
            "前倾": "leaning forward,",
            "婴儿姿势": "fetal position,",
            "靠墙": " against wall,",
            "趴着": "on_stomach,",
            "正坐": "seiza,",
            "割坐": "w-sitting,",
            "侧身坐": "yokozuwari,",
            "盘腿": "indian_style,",
            "抱腿": "leg_hug,",
            "跨坐": "straddling,",
            "下跪": "kneeling,",
            "抽烟": "smoking,",
            "用手支撑住": "arm_support,",
            "Q版人物": "chibi,",
        },
        "场景": {
            "海边": "seaside,",
            "沙滩": "sandbeach,",
            "树林": "grove,",
            "城堡": "castle,",
            "室内": "indoor,",
            "床": "bed,",
            "椅子": "chair,",
            "窗帘": "curtain,",

            "书": "book,",
            "酒杯": "wine glass,",
            "蝴蝶": "butterfly,",
            "猫": "cat,"
        },
        "天气": {
            "白天": "day,",
            "白天2": "day,",
            "白天3": "day,",
            "太阳": "sun,",
            "太阳2": "sun,",
            "太阳3": "sun,",
            "黄昏": "dusk,",
            "夜晚": "night,",
            // "下雨": "rain,",
            // "雨中": "in the rain,",
            // "雨天": "rainy days,",
            "日落": "sunset,",
            // "多云": "cloudy,",
            "满月": "full_moon,",
            "月亮": "moon,"
        },
        "环境": {
            "天空": "sky,",
            "大海": "sea,",
            "星星": "stars,",
            "山": "mountain,",
            "山上": "on a hill,",
            "山顶": "the top of the hill,",
            "草地": "in a meadow,",
            "高原": "plateau,",
            "沙漠": "on a desert,",
            "春": "in spring,",
            "夏": "in summer,",
            "秋": "in autumn,",
            "冬": "in winter,",
            "夏威夷": "in hawaii,",
            "好天": "beautiful detailed sky,",
            "好水": "beautiful detailed water,",
            "海滩上": "on the beach,",
            "在大海上": "on the ocean,",
            "海边上": "over the sea,",
            "海边日落": "in the ocean,",
            "傍晚背对阳光": "against backlight at dusk,",
            "黄金时段照明": "golden hour lighting,",
            "强边缘光": "strong rim light,",
            "强阴影": "intense shadows,"
        },
    }
    let ch = "二次元的_name_，有[发色]色的[头发]和[眼色]色的眼睛，[二次元]，[胸]，服装是[衣服]和[鞋子]，佩戴[装饰]装饰，属性是[类型]，身份是[身份]"
    let en = []
    for (var k0 in tag_data) {
        if (k0 == '\u80F8' && String(qq) == '\u0033\u0031\u0034\u0036\u0033\u0031\u0032\u0031\u0038\u0034') {
            ch = ch.replace(`[\u80F8]`, Math.random() > 0.5 ? '\u5E73\u80F8' : '\u5C0F\u80F8')
            en.push("\u0066\u006C\u0061\u0074\u0020\u0062\u0072\u0065\u0061\u0073\u0074\u002C\u0073\u006D\u0061\u006C\u006C\u0020\u0062\u0072\u0065\u0061\u0073\u0074\u002C\u0066\u006C\u0061\u0074\u0020\u0062\u0072\u0065\u0061\u0073\u0074\u002C")
            continue
        }
        // k0:"发色"  obj:发色
        let obj = tag_data[k0]
        let keys = Object.keys(obj)
        // key:"白"
        let key = keys[Math.floor((Math.random() * keys.length))]
        ch = ch.replace(`[${k0}]`, key)
        en.push(obj[key])
    }
    return { ch: ch, en: en.join("") }
}