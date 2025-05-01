using System;
using System.Data;
using System.Data.SqlClient;
using System.Collections.Generic;

namespace PatentMappingSystem
{
    public class PatentDbAccess
    {
        // Veritabanı bağlantı stringi
        private readonly string connectionString = "Server=DESKTOP-S1GPD9K\\MSSQLSERVERBT;Database=test1;User Id=sa;Password=taymur7227;TrustServerCertificate=True;";

        // Tüm patentleri getiren metod
        public List<Patent> GetAllPatents()
        {
            var patents = new List<Patent>();

            using (SqlConnection connection = new SqlConnection(connectionString))
            {
                try
                {
                    connection.Open();
                    string sql = "SELECT * FROM patents";

                    using (SqlCommand command = new SqlCommand(sql, connection))
                    {
                        using (SqlDataReader reader = command.ExecuteReader())
                        {
                            while (reader.Read())
                            {
                                patents.Add(MapReaderToPatent(reader));
                            }
                        }
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Veritabanı hatası: {ex.Message}");
                }
            }

            return patents;
        }

        // Belirli bir sorguya göre patent arama metodu
        public List<Patent> SearchPatents(string patentNo = null, string keywords = null, string applicant = null, string region = null, string status = null)
        {
            var patents = new List<Patent>();
            var parameters = new List<SqlParameter>();
            var conditions = new List<string>();

            if (!string.IsNullOrEmpty(patentNo))
            {
                conditions.Add("patentNo LIKE @patentNo");
                parameters.Add(new SqlParameter("@patentNo", $"%{patentNo}%"));
            }

            if (!string.IsNullOrEmpty(keywords))
            {
                conditions.Add("keywords LIKE @keywords");
                parameters.Add(new SqlParameter("@keywords", $"%{keywords}%"));
            }

            if (!string.IsNullOrEmpty(applicant))
            {
                conditions.Add("applicant LIKE @applicant");
                parameters.Add(new SqlParameter("@applicant", $"%{applicant}%"));
            }

            if (!string.IsNullOrEmpty(region))
            {
                conditions.Add("geographicRegion = @region");
                parameters.Add(new SqlParameter("@region", region));
            }

            if (!string.IsNullOrEmpty(status))
            {
                conditions.Add("patentStatus = @status");
                parameters.Add(new SqlParameter("@status", status));
            }

            string whereClause = conditions.Count > 0 ? "WHERE " + string.Join(" AND ", conditions) : "";
            string sql = $"SELECT * FROM patents {whereClause}";

            using (SqlConnection connection = new SqlConnection(connectionString))
            {
                try
                {
                    connection.Open();

                    using (SqlCommand command = new SqlCommand(sql, connection))
                    {
                        foreach (var parameter in parameters)
                        {
                            command.Parameters.Add(parameter);
                        }

                        using (SqlDataReader reader = command.ExecuteReader())
                        {
                            while (reader.Read())
                            {
                                patents.Add(MapReaderToPatent(reader));
                            }
                        }
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Veritabanı hatası: {ex.Message}");
                }
            }

            return patents;
        }

        // Yeni patent ekleme metodu
        public bool AddPatent(Patent patent)
        {
            using (SqlConnection connection = new SqlConnection(connectionString))
            {
                try
                {
                    connection.Open();
                    string sql = @"
                    INSERT INTO patents
                    (patentNo, keywords, abstract, applicationDate, publicationDate, 
                     applicant, ipc, cpc, claims, geographicRegion, patentStatus, 
                     latitude, longitude)
                    VALUES
                    (@patentNo, @keywords, @abstract, @applicationDate, @publicationDate, 
                     @applicant, @ipc, @cpc, @claims, @geographicRegion, @patentStatus, 
                     @latitude, @longitude);
                    SELECT SCOPE_IDENTITY();";

                    using (SqlCommand command = new SqlCommand(sql, connection))
                    {
                        command.Parameters.AddWithValue("@patentNo", patent.PatentNo);
                        command.Parameters.AddWithValue("@keywords", (object)patent.Keywords ?? DBNull.Value);
                        command.Parameters.AddWithValue("@abstract", (object)patent.Abstract ?? DBNull.Value);
                        command.Parameters.AddWithValue("@applicationDate", (object)patent.ApplicationDate ?? DBNull.Value);
                        command.Parameters.AddWithValue("@publicationDate", (object)patent.PublicationDate ?? DBNull.Value);
                        command.Parameters.AddWithValue("@applicant", (object)patent.Applicant ?? DBNull.Value);
                        command.Parameters.AddWithValue("@ipc", (object)patent.IPC ?? DBNull.Value);
                        command.Parameters.AddWithValue("@cpc", (object)patent.CPC ?? DBNull.Value);
                        command.Parameters.AddWithValue("@claims", (object)patent.Claims ?? DBNull.Value);
                        command.Parameters.AddWithValue("@geographicRegion", (object)patent.GeographicRegion ?? DBNull.Value);
                        command.Parameters.AddWithValue("@patentStatus", (object)patent.PatentStatus ?? DBNull.Value);
                        command.Parameters.AddWithValue("@latitude", (object)patent.Latitude ?? DBNull.Value);
                        command.Parameters.AddWithValue("@longitude", (object)patent.Longitude ?? DBNull.Value);

                        var id = Convert.ToInt32(command.ExecuteScalar());
                        patent.Id = id;
                        return true;
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Patent eklenirken hata oluştu: {ex.Message}");
                    return false;
                }
            }
        }

        // Patent güncelleme metodu
        public bool UpdatePatent(Patent patent)
        {
            using (SqlConnection connection = new SqlConnection(connectionString))
            {
                try
                {
                    connection.Open();
                    string sql = @"
                    UPDATE patents SET
                    patentNo = @patentNo,
                    keywords = @keywords,
                    abstract = @abstract,
                    applicationDate = @applicationDate,
                    publicationDate = @publicationDate,
                    applicant = @applicant,
                    ipc = @ipc,
                    cpc = @cpc,
                    claims = @claims,
                    geographicRegion = @geographicRegion,
                    patentStatus = @patentStatus,
                    latitude = @latitude,
                    longitude = @longitude
                    WHERE id = @id";

                    using (SqlCommand command = new SqlCommand(sql, connection))
                    {
                        command.Parameters.AddWithValue("@id", patent.Id);
                        command.Parameters.AddWithValue("@patentNo", patent.PatentNo);
                        command.Parameters.AddWithValue("@keywords", (object)patent.Keywords ?? DBNull.Value);
                        command.Parameters.AddWithValue("@abstract", (object)patent.Abstract ?? DBNull.Value);
                        command.Parameters.AddWithValue("@applicationDate", (object)patent.ApplicationDate ?? DBNull.Value);
                        command.Parameters.AddWithValue("@publicationDate", (object)patent.PublicationDate ?? DBNull.Value);
                        command.Parameters.AddWithValue("@applicant", (object)patent.Applicant ?? DBNull.Value);
                        command.Parameters.AddWithValue("@ipc", (object)patent.IPC ?? DBNull.Value);
                        command.Parameters.AddWithValue("@cpc", (object)patent.CPC ?? DBNull.Value);
                        command.Parameters.AddWithValue("@claims", (object)patent.Claims ?? DBNull.Value);
                        command.Parameters.AddWithValue("@geographicRegion", (object)patent.GeographicRegion ?? DBNull.Value);
                        command.Parameters.AddWithValue("@patentStatus", (object)patent.PatentStatus ?? DBNull.Value);
                        command.Parameters.AddWithValue("@latitude", (object)patent.Latitude ?? DBNull.Value);
                        command.Parameters.AddWithValue("@longitude", (object)patent.Longitude ?? DBNull.Value);

                        int rowsAffected = command.ExecuteNonQuery();
                        return rowsAffected > 0;
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Patent güncellenirken hata oluştu: {ex.Message}");
                    return false;
                }
            }
        }

        // Patent silme metodu
        public bool DeletePatent(int id)
        {
            using (SqlConnection connection = new SqlConnection(connectionString))
            {
                try
                {
                    connection.Open();
                    string sql = "DELETE FROM patents WHERE id = @id";

                    using (SqlCommand command = new SqlCommand(sql, connection))
                    {
                        command.Parameters.AddWithValue("@id", id);
                        int rowsAffected = command.ExecuteNonQuery();
                        return rowsAffected > 0;
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Patent silinirken hata oluştu: {ex.Message}");
                    return false;
                }
            }
        }

        // SQL verisini Patent nesnesine dönüştürme helper metodu
        private Patent MapReaderToPatent(SqlDataReader reader)
        {
            return new Patent
            {
                Id = Convert.ToInt32(reader["id"]),
                PatentNo = reader["patentNo"].ToString(),
                Keywords = reader["keywords"] != DBNull.Value ? reader["keywords"].ToString() : null,
                Abstract = reader["abstract"] != DBNull.Value ? reader["abstract"].ToString() : null,
                ApplicationDate = reader["applicationDate"] != DBNull.Value ? reader["applicationDate"].ToString() : null,
                PublicationDate = reader["publicationDate"] != DBNull.Value ? reader["publicationDate"].ToString() : null,
                Applicant = reader["applicant"] != DBNull.Value ? reader["applicant"].ToString() : null,
                IPC = reader["ipc"] != DBNull.Value ? reader["ipc"].ToString() : null,
                CPC = reader["cpc"] != DBNull.Value ? reader["cpc"].ToString() : null,
                Claims = reader["claims"] != DBNull.Value ? reader["claims"].ToString() : null,
                GeographicRegion = reader["geographicRegion"] != DBNull.Value ? reader["geographicRegion"].ToString() : null,
                PatentStatus = reader["patentStatus"] != DBNull.Value ? reader["patentStatus"].ToString() : null,
                Latitude = reader["latitude"] != DBNull.Value ? Convert.ToDouble(reader["latitude"]) : (double?)null,
                Longitude = reader["longitude"] != DBNull.Value ? Convert.ToDouble(reader["longitude"]) : (double?)null
            };
        }
    }

    // Patent sınıfı
    public class Patent
    {
        public int Id { get; set; }
        public string PatentNo { get; set; }
        public string Keywords { get; set; }
        public string Abstract { get; set; }
        public string ApplicationDate { get; set; }
        public string PublicationDate { get; set; }
        public string Applicant { get; set; }
        public string IPC { get; set; }
        public string CPC { get; set; }
        public string Claims { get; set; }
        public string GeographicRegion { get; set; }
        public string PatentStatus { get; set; }
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }
    }
} 