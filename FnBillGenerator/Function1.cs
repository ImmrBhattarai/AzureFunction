using Azure.Messaging.ServiceBus;
using BarcodeStandard;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;

namespace fnTicketGenerator
{
    public class BarcodeGenerator
    {
        private readonly ILogger<BarcodeGenerator> _logger;
        private readonly string _serviceBusConnectionString;
        private readonly string _queueName = "generator-bill";   // Updated queue name

        public BarcodeGenerator(ILogger<BarcodeGenerator> logger)
        {
            _logger = logger;
            _serviceBusConnectionString = Environment.GetEnvironmentVariable("ServiceBusConnectionString"); // Ensure this points to the billgenerator namespace
        }

        [Function("barcode-generate")]
        public async Task<IActionResult> Run([HttpTrigger(AuthorizationLevel.Function, "post")] HttpRequest req)
        {
            try
            {
                string requestBody = await new StreamReader(req.Body).ReadToEndAsync();
                dynamic data = JsonConvert.DeserializeObject(requestBody);

                string value = data?.value;
                string dueDate = data?.dueDate;

                string barcodeData;

                // Data validation
                if (string.IsNullOrEmpty(value) || string.IsNullOrEmpty(dueDate))
                {
                    return new BadRequestObjectResult("The fields value and dueDate are required");
                }

                // Validate due date format YYYY-MM-DD
                if (!DateTime.TryParseExact(dueDate, "yyyy-MM-dd", null, System.Globalization.DateTimeStyles.None, out DateTime dateObj))
                {
                    return new BadRequestObjectResult("Invalid Due Date");
                }

                string dateStr = dateObj.ToString("yyyyMMdd");

                // Convert value to cents and format to 8 digits
                if (!decimal.TryParse(value, out decimal valueDecimal))
                {
                    return new BadRequestObjectResult("Invalid value");
                }
                int valueCents = (int)(valueDecimal * 100);
                string valueStr = valueCents.ToString("D8");

                string bankCode = "008";
                string baseCode = string.Concat(bankCode, dateStr, valueStr);
                // Fill the barcode to have 44 characters
                barcodeData = baseCode.Length < 44 ? baseCode.PadRight(44, '0') : baseCode.Substring(0, 44);
                _logger.LogInformation($"Generated barcode: {barcodeData}");

                Barcode barcode = new Barcode();
                var skImage = barcode.Encode(BarcodeStandard.Type.Code128, barcodeData);

                using (var encodeData = skImage.Encode(SkiaSharp.SKEncodedImageFormat.Png, 100))
                {
                    var imageBytes = encodeData.ToArray();

                    string base64String = Convert.ToBase64String(imageBytes);

                    var resultObject = new
                    {
                        barcode = barcodeData,
                        originalValue = valueDecimal,
                        dueDate = DateTime.Now.AddDays(5),
                        imageBase64 = base64String
                    };

                    await SendFileFallback(resultObject, _serviceBusConnectionString, _queueName);

                    return new OkObjectResult(resultObject);
                }
            }
            catch (Exception ex)
            {
                return new StatusCodeResult(StatusCodes.Status500InternalServerError);
            }
        }

        private async Task SendFileFallback(object resultObject, string serviceBusConnectionString, string queueName)
        {
            await using var client = new ServiceBusClient(serviceBusConnectionString);

            ServiceBusSender sender = client.CreateSender(queueName);

            string messageBody = JsonConvert.SerializeObject(resultObject);

            ServiceBusMessage message = new ServiceBusMessage(messageBody);

            await sender.SendMessageAsync(message);

            _logger.LogInformation($"Message sent to the queue {queueName}");
        }
    }
}
