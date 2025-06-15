using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using System.ComponentModel.DataAnnotations;

namespace fnValidateTicket
{
    public class Function1
    {
        private readonly ILogger<Function1> _logger;

        public Function1(ILogger<Function1> logger)
        {
            _logger = logger;
        }

        [Function("barcode-validate")]
        public async Task<IActionResult> Run([HttpTrigger(AuthorizationLevel.Function, "post")] HttpRequest req)
        {
            string requestBody = await new StreamReader(req.Body).ReadToEndAsync();
            dynamic data = JsonConvert.DeserializeObject(requestBody);
            string barcodeData = data?.barcode;

            if (string.IsNullOrEmpty(barcodeData))
            {
                return new BadRequestObjectResult("The barcode field is required");
            }

            if (barcodeData.Length != 44)
            {
                var result = new { valid = false, message = "The barcode field must have 44 characters" };
                return new BadRequestObjectResult(result);
            }

            string datePart = barcodeData.Substring(3, 8);
            if (!DateTime.TryParseExact(datePart, "yyyyMMdd", null, System.Globalization.DateTimeStyles.None, out DateTime dateObj))
            {
                var result = new { valid = false, message = "Invalid Expiration Date" };
                return new BadRequestObjectResult(result);
            }

            var resultOk = new { valid = true, message = "Valid ticket", expiration = dateObj.ToString("dd-MM-yyyy") };
            return new OkObjectResult(resultOk);
        }
    }
}