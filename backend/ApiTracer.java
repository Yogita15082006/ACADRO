import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class ApiTracer {

    private static final String STUDENT_ID = "ad19bf82-026b-4fac-a378-571831cb99d7";
    private static final String STUDENT_EMAIL = "ananyaverma231154@acropolis.in";
    private static final String API_URL = "http://localhost:8080/api/v1/profile";
    private static final String AUTH_URL = "http://localhost:8080/api/auth/login";

    public static void main(String[] args) throws Exception {
        System.out.println("====== STEP 1: RESET PASSWORD & CHECK DB ======");
        resetPasswordAndCheckDb();

        System.out.println("\n====== STEP 2: LOGIN VIA API ======");
        HttpClient client = HttpClient.newHttpClient();
        String loginPayload = "{\"email\":\"" + STUDENT_EMAIL + "\",\"password\":\"password123\"}";
        HttpRequest loginReq = HttpRequest.newBuilder()
                .uri(URI.create(AUTH_URL))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(loginPayload))
                .build();
        HttpResponse<String> loginRes = client.send(loginReq, HttpResponse.BodyHandlers.ofString());
        
        String token = "";
        Matcher m = Pattern.compile("\"token\":\"([^\"]+)\"").matcher(loginRes.body());
        if (m.find()) {
            token = m.group(1);
            System.out.println("Token acquired successfully.");
        } else {
            System.out.println("Failed to get token: " + loginRes.body());
            return;
        }

        System.out.println("\n====== STEP 3: GET API BEFORE SAVE ======");
        HttpRequest getReq1 = HttpRequest.newBuilder()
                .uri(URI.create(API_URL))
                .header("Authorization", "Bearer " + token)
                .GET()
                .build();
        HttpResponse<String> res1 = client.send(getReq1, HttpResponse.BodyHandlers.ofString());
        System.out.println("GET Response Code: " + res1.statusCode());
        System.out.println("GET Response Body: " + res1.body());

        System.out.println("\n====== STEP 4: PUT API (SAVE) ======");
        String payload = "{\"firstName\":\"Ananya\",\"lastName\":\"\",\"phone\":\"9999999999\",\"enrollmentNo\":\"0827CS231154\"}";
        HttpRequest putReq = HttpRequest.newBuilder()
                .uri(URI.create(API_URL))
                .header("Authorization", "Bearer " + token)
                .header("Content-Type", "application/json")
                .PUT(HttpRequest.BodyPublishers.ofString(payload))
                .build();
        HttpResponse<String> putRes = client.send(putReq, HttpResponse.BodyHandlers.ofString());
        System.out.println("PUT Response Code: " + putRes.statusCode());
        System.out.println("PUT Response Body: " + putRes.body());

        System.out.println("\n====== STEP 5: DB CHECK AFTER SAVE ======");
        checkDatabase();

        System.out.println("\n====== STEP 6: GET API AFTER SAVE ======");
        HttpResponse<String> res2 = client.send(getReq1, HttpResponse.BodyHandlers.ofString());
        System.out.println("GET Response Code: " + res2.statusCode());
        System.out.println("GET Response Body: " + res2.body());
    }

    private static void resetPasswordAndCheckDb() {
        String url = "jdbc:postgresql://localhost:5432/acronexus";
        String user = "postgres";
        String password = "payal";
        try (Connection conn = DriverManager.getConnection(url, user, password)) {
            // $2a$10$w8w... is 'password123' bcrypt hash
            String hash = "$2a$10$w8w1B.d/P8qH0ZJ2/4K2/.s7T5/L7E1D8r1eG6y0k5z0X4W3X4/bW";
            String update = "UPDATE users SET password_hash = ?, is_activated = true WHERE id = ?";
            try (PreparedStatement ps = conn.prepareStatement(update)) {
                ps.setString(1, hash);
                ps.setObject(2, java.util.UUID.fromString(STUDENT_ID));
                ps.executeUpdate();
            }
            checkDatabase();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private static void checkDatabase() {
        String url = "jdbc:postgresql://localhost:5432/acronexus";
        String user = "postgres";
        String password = "payal";
        try (Connection conn = DriverManager.getConnection(url, user, password)) {
            String q = "SELECT phone FROM users WHERE id = '" + STUDENT_ID + "'";
            try (Statement s = conn.createStatement(); ResultSet rs = s.executeQuery(q)) {
                if (rs.next()) {
                    System.out.println("DB phone = " + rs.getString("phone"));
                }
            }
            String q2 = "SELECT enrollment_no FROM students WHERE user_id = '" + STUDENT_ID + "'";
            try (Statement s = conn.createStatement(); ResultSet rs = s.executeQuery(q2)) {
                if (rs.next()) {
                    System.out.println("DB enrollment_no = " + rs.getString("enrollment_no"));
                } else {
                    System.out.println("DB enrollment_no = <NOT FOUND IN STUDENTS TABLE>");
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
