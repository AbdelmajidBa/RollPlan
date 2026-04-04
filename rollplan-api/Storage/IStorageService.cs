namespace RollPlan.Api.Storage;

public interface IStorageService
{
    /// <summary>Uploads a file and returns its publicly accessible URL.</summary>
    Task<string> UploadFileAsync(Stream fileStream, string fileName, string contentType);

    /// <summary>Deletes a file by its public URL. Idempotent — no-op if not found.</summary>
    Task DeleteFileAsync(string fileUrl);
}
