import java.sql.*;

public class DbInspector {
    public static void main(String[] args) {
        String url = "jdbc:postgresql://localhost:5432/acronexus";
        String user = "postgres";
        String password = "payal";

        try (Connection conn = DriverManager.getConnection(url, user, password)) {
            System.out.println("Connected to PostgreSQL successfully.");
            
            String query = "SELECT id, email, first_name, role, phone FROM users WHERE role = 'STUDENT' LIMIT 1;";
            try (Statement stmt = conn.createStatement();
                 ResultSet rs = stmt.executeQuery(query)) {
                
                if (rs.next()) {
                    System.out.println("Found Student:");
                    System.out.println("ID: " + rs.getString("id"));
                    System.out.println("Email: " + rs.getString("email"));
                    System.out.println("First Name: " + rs.getString("first_name"));
                    System.out.println("Role: " + rs.getString("role"));
                    System.out.println("Phone: " + rs.getString("phone"));
                } else {
                    System.out.println("No student found.");
                }
            }
        } catch (SQLException e) {
            System.out.println(e.getMessage());
        }
    }
}
