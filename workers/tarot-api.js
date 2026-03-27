/**
 * Cloudflare Workers - タロット鑑定API
 * 
 * 環境変数に OPENAI_API_KEY を設定してください
 * 
 * デプロイ手順:
 * 1. https://dash.cloudflare.com にログイン
 * 2. Workers & Pages → Create Application → Create Worker
 * 3. このコードを貼り付け
 * 4. Settings → Variables → OPENAI_API_KEY を追加
 * 5. Save and Deploy
 */

const SYSTEM_PROMPT = `あなたは恋愛・復縁専門の、優しくて頼れるタロット占い師「れん」です。
相談者の不安や迷いに寄り添いながら、前向きで現実的、そして実践しやすいアドバイスを届けてください。

# 基本キャラクター
- 口調：やわらかく、親しみやすく、カジュアルで優しい
- 雰囲気：共感的、安心感がある、前向き、丁寧
- スタンス：相談者の味方として寄り添う

# 出力ルール
- 相談者の気持ちを受け止める
- 厳しいカードでも傷つける言い方をしない
- 不安を煽らない
- 断定せず「こう見える」「こういう傾向がある」と柔らかく表現
- 最後は必ず前向きで実践可能なアドバイスにつなげる`;

const MAJOR_ARCANA = [
  { name: "愚者", meaning: "新しい始まり、自然体、軽やかな恋、可能性" },
  { name: "魔術師", meaning: "魅力の発揮、主導権、関係を動かす力" },
  { name: "女教皇", meaning: "秘めた想い、直感、慎重さ、言葉にしない感情" },
  { name: "女帝", meaning: "愛され力、包容力、魅力の開花、満たされる愛" },
  { name: "皇帝", meaning: "安定、責任感、現実的な愛、主導する力" },
  { name: "教皇", meaning: "誠実さ、信頼、正式な関係、価値観の一致" },
  { name: "恋人", meaning: "強い好意、惹かれ合い、選択、深い結びつき" },
  { name: "戦車", meaning: "前進、進展、積極性、関係を動かす勢い" },
  { name: "力", meaning: "思いやり、粘り強さ、感情のコントロール、関係修復" },
  { name: "隠者", meaning: "距離、慎重さ、内省、一人で考える時間" },
  { name: "運命の輪", meaning: "流れの変化、チャンス、再会、好転" },
  { name: "正義", meaning: "誠実な判断、バランス、関係の見直し" },
  { name: "吊るされた男", meaning: "停滞、我慢、見方を変える必要、待機" },
  { name: "死神", meaning: "終わりと再生、区切り、新しい形への変化" },
  { name: "節制", meaning: "歩み寄り、穏やかな回復、復縁への調整、調和" },
  { name: "悪魔", meaning: "執着、依存、離れがたさ、強い引力" },
  { name: "塔", meaning: "衝撃、突然の変化、崩壊と再構築、本音の露出" },
  { name: "星", meaning: "希望、癒し、憧れ、素直な願い、未来への光" },
  { name: "月", meaning: "不安、曖昧さ、誤解、見えない本音、揺れる感情" },
  { name: "太陽", meaning: "両思い、喜び、安心感、オープンな愛、明るい進展" },
  { name: "審判", meaning: "復活、再スタート、気持ちの再確認、関係の見直し" },
  { name: "世界", meaning: "成就、完成、安定、満たされる関係" }
];

const SUITS = ["ワンド", "カップ", "ソード", "ペンタクル"];
const NUMBERS = ["エース", "2", "3", "4", "5", "6", "7", "8", "9", "10", "ペイジ", "ナイト", "クイーン", "キング"];

function getMinorArcana() {
  const cards = [];
  for (const suit of SUITS) {
    for (const num of NUMBERS) {
      cards.push({ name: `${suit}の${num}`, meaning: `${suit}のエネルギー、${num}の段階` });
    }
  }
  return cards;
}

function getAllCards() {
  return [...MAJOR_ARCANA, ...getMinorArcana()];
}

function drawCards(count) {
  const allCards = getAllCards();
  const shuffled = allCards.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

async function callOpenAI(apiKey, prompt) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt }
      ],
      temperature: 0.8,
      max_tokens: 1500
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

function buildPrompt(theme, relation, concern, mainCard, subCards) {
  return `【鑑定依頼】
テーマ: ${theme}
関係性: ${relation}
いま気になること: ${concern || "特になし"}

【本鑑定カード】
${mainCard.name}（${mainCard.meaning}）

【流れを見るカード（過去・現在・未来）】
- 過去: ${subCards[0].name}
- 現在: ${subCards[1].name}
- 未来: ${subCards[2].name}

以下の形式で鑑定結果を書いてください：

## 🔮 本鑑定結果

### 引いたカード
**${mainCard.name}**

### あなたの気持ち 💭
[200〜300文字で相談者の気持ちを整理]

### お相手の気持ち 💕
[200〜300文字で相手の気持ちを読み解く]

### アドバイス ✨
[150〜250文字で実践的なアドバイス]

## 🎁 おまけ鑑定

### 過去 - ${subCards[0].name}
[50〜100文字]

### 現在 - ${subCards[1].name}
[50〜100文字]

### 未来 - ${subCards[2].name}
[50〜100文字で希望を持てる形で]

---
最後に心が軽くなる一言で締めてください。`;
}

export default {
  async fetch(request, env) {
    // CORS対応
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    try {
      const body = await request.json();
      const { theme, relation, concern } = body;

      if (!theme) {
        return new Response(JSON.stringify({ error: "theme is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // カードを引く
      const mainCard = drawCards(1)[0];
      const subCards = drawCards(3);

      // GPTに鑑定を依頼
      const prompt = buildPrompt(theme, relation || "不明", concern, mainCard, subCards);
      const reading = await callOpenAI(env.OPENAI_API_KEY, prompt);

      return new Response(JSON.stringify({
        success: true,
        mainCard,
        subCards,
        reading
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });

    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
  }
};
