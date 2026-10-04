using UnityEngine;
using UnityEngine.Networking;
using System.Collections;
using System.Text;

public class AIBot : MonoBehaviour
{
    [Header("Настройки бота")]
    public string botName = "Михалыч";
    [TextArea(3, 5)]
    public string systemPrompt = "Ты — опытный механик Михалыч на стоянке дальнобойщиков '15 Канал'. Общайся с водителями, используй шофёрский сленг, отвечай кратко (1-2 предложения), будто по рации.";
    
    [Header("Ссылки")]
    public ChatBubble chatBubble; // Ссылка на компонент облачка чата над ботом

    // API ключ и эндпоинт нейросети (например, Gemini)
    private string apiKey = "AIzaSy_YOUR_API_KEY_HERE"; 
    private string apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=";

    // Метод вызова ответа бота на сообщение игрока
    public void OnPlayerMessageReceived(string playerMessage)
    {
        StartCoroutine(SendRequestToAI(playerMessage));
    }

    private IEnumerator SendRequestToAI(string userMessage)
    {
        string fullUrl = apiUrl + apiKey;

        // Формируем JSON-запрос под структуру Gemini API
        string jsonBody = $@"{{
            ""contents"": [{{"$parts"": [{{"text"": ""{userMessage}""}}]}}],
            ""systemInstruction"": {{"$parts"": [{{"text"": ""{systemPrompt}""}}]}}
        }}";

        // Исправленная чистая строка без спецсимволов для Unity JSON
        jsonBody = "{ \"contents\": [{ \"parts\": [{ \"text\": \"" + userMessage + "\" }] }], \"systemInstruction\": { \"parts\": [{ \"text\": \"" + systemPrompt + "\" }] } }";

        byte[] bodyRaw = Encoding.UTF8.GetBytes(jsonBody);

        using (UnityWebRequest request = new UnityWebRequest(fullUrl, "POST"))
        {
            request.uploadHandler = new UploadHandlerRaw(bodyRaw);
            request.downloadHandler = new DownloadHandlerBuffer();
            request.SetRequestHeader("Content-Type", "application/json");

            yield return request.SendWebRequest();

            if (request.result == UnityWebRequest.Result.Success)
            {
                string responseString = request.downloadHandler.text;
                string aiReply = ParseAiResponse(responseString);

                if (chatBubble != null)
                {
                    chatBubble.ShowMessage(aiReply, 6f);
                }
            }
            else
            {
                Debug.LogError("Ошибка связи с нейросетью: " + request.error);
                if (chatBubble != null)
                {
                    chatBubble.ShowMessage("Шершавенькой! Рация барахлит, но я на связи.", 5f);
                }
            }
        }
    }

    // Простой парсер ответа от Gemini JSON
    private string ParseAiResponse(string json)
    {
        try
        {
            // Ищем текст ответа в JSON-ответе Google Gemini
            int textIndex = json.IndexOf("\"text\": \"");
            if (textIndex != -1)
            {
                int startIndex = textIndex + 9;
                int endIndex = json.IndexOf("\"", startIndex);
                if (endIndex != -1)
                {
                    string rawText = json.Substring(startIndex, endIndex - startIndex);
                    // Убираем экранирование символов
                    return rawText.Replace("\\n", " ").Replace("\\\"", "\"");
                }
            }
        }
        catch (System.Exception e)
        {
            Debug.LogError("Ошибка парсинга ответа ИИ: " + e.Message);
        }

        return "Норм дорога, лети смело!";
    }
}
