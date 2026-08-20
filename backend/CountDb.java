import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;

public class CountDb {
    public static void main(String[] args) {
        String url = "jdbc:postgresql://localhost:5432/acronexus";
        String user = "postgres";
        String password = "payal";
        
        try (Connection conn = DriverManager.getConnection(url, user, password);
             Statement stmt = conn.createStatement()) {
            
            String examId = "6a3db3cc-2728-4381-a74d-ad8074552314";
            
            ResultSet rs1 = stmt.executeQuery("SELECT COUNT(DISTINCT student_id) FROM exam_results WHERE examination_id = '" + examId + "';");
            if (rs1.next()) {
                System.out.println("Students with exam_results: " + rs1.getInt(1));
            }
            
            ResultSet rs2 = stmt.executeQuery("SELECT COUNT(DISTINCT student_id) FROM exam_ai_feedback WHERE examination_id = '" + examId + "';");
            if (rs2.next()) {
                System.out.println("Students with exam_ai_feedback: " + rs2.getInt(1));
            }
            
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
