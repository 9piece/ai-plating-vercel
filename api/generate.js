export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { prompt } = req.body;

  try {
    const createResponse = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Token r8_0gvoUqfns7cqTFVXKel066BlPgWlKUW2Abr19",
      },
      body: JSON.stringify({
        version: "5c5f555d87c72b15c5ba9a0c47c6b66a1c8a58c1b25eb0ccf6796a0f38c24f9e",
        input: {
          prompt: prompt,
          width: 512,
          height: 512
        }
      })
    });

    const creation = await createResponse.json();

    // ✅ 加入结构检测，避免 undefined 错误
    if (!creation.urls || !creation.urls.get) {
      return res.status(500).json({ error: "Replicate API 返回结构异常", detail: creation });
    }

    const statusUrl = creation.urls.get;

    for (let i = 0; i < 20; i++) {
      const statusRes = await fetch(statusUrl, {
        headers: {
          Authorization: "Token r8_0gvoUqfns7cqTFVXKel066BlPgWlKUW2Abr19"
        }
      });
      const statusData = await statusRes.json();

      if (statusData.status === "succeeded") {
        return res.status(200).json({ image: statusData.output[0] });
      }

      if (statusData.status === "failed") {
        return res.status(500).json({ error: "图像生成失败", detail: statusData });
      }

      await new Promise((r) => setTimeout(r, 1500));
    }

    return res.status(500).json({ error: "生成超时，请稍后重试" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
