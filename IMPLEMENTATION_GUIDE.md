# Implementation Guide: Step-by-Step Setup

## Step 1: Create New Supabase Project

### Instructions:
1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Fill in:
   - **Project name**: `tiles-inventory-app-v2`
   - **Database password**: Create strong password (save it!)
   - **Region**: Choose closest to your location
4. Wait 2-3 minutes for creation
5. Go to **Settings → Database → Connection Info**
6. Copy: **Host, Port (5432), Database (postgres), User (postgres), Password**

---

## Step 2: Get New Database Credentials

Your connection string should look like:
```
postgresql://postgres:YOUR_PASSWORD@YOUR_HOST:5432/postgres?sslmode=require
```

---

## Step 3: Run Schema in Supabase

1. In Supabase Dashboard → **SQL Editor** → Click **New Query**
2. Paste entire content from `DATABASE_DESIGN.md` SQL section
3. Click **Run**
4. Verify all tables created

---

## Step 4: Update Backend Configuration

### Update `backend/src/main/resources/application.yml`

```yaml
spring:
  application:
    name: tiles-inventory-backend
  
  datasource:
    url: jdbc:postgresql://YOUR_HOST:5432/postgres?sslmode=require
    username: postgres
    password: YOUR_PASSWORD
    hikari:
      maximum-pool-size: 10
      minimum-idle: 2

  jpa:
    hibernate:
      ddl-auto: validate  # Changed from update - schema already exists
    show-sql: false
    properties:
      hibernate:
        dialect: org.hibernate.dialect.PostgreSQLDialect
        format_sql: true
        jdbc:
          batch_size: 20
          fetch_size: 50

  jackson:
    serialization:
      indent-output: true
      write-dates-as-timestamps: false
    default-property-inclusion: non_null

  jwt:
    secret: YOUR_JWT_SECRET_KEY_MIN_32_CHARS  # Generate random string
    expiration: 86400000  # 24 hours in milliseconds

server:
  port: 8080
  servlet:
    context-path: /api

logging:
  level:
    root: INFO
    com.inventory: DEBUG
    org.springframework.security: DEBUG

app:
  cors:
    allowed-origins: http://localhost:3000,http://localhost:3001
```

---

## Step 5: Update `pom.xml` - Add Dependencies

Add these to your `<dependencies>` section in `pom.xml`:

```xml
<!-- Spring Security & JWT -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-security</artifactId>
</dependency>

<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-api</artifactId>
    <version>0.12.3</version>
</dependency>

<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-impl</artifactId>
    <version>0.12.3</version>
    <scope>runtime</scope>
</dependency>

<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-jackson</artifactId>
    <version>0.12.3</version>
    <scope>runtime</scope>
</dependency>

<!-- PDF Generation for bills -->
<dependency>
    <groupId>com.itextpdf</groupId>
    <artifactId>itextpdf</artifactId>
    <version>5.5.13</version>
</dependency>

<!-- PostgreSQL Driver -->
<dependency>
    <groupId>org.postgresql</groupId>
    <artifactId>postgresql</artifactId>
    <version>42.7.1</version>
    <scope>runtime</scope>
</dependency>

<!-- Lombok (optional but recommended) -->
<dependency>
    <groupId>org.projectlombok</groupId>
    <artifactId>lombok</artifactId>
    <optional>true</optional>
</dependency>

<!-- Validation -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-validation</artifactId>
</dependency>
```

---

## Step 6: Create Core Entity Classes

### Create: `backend/src/main/java/com/inventory/entity/Tenant.java`

```java
package com.inventory.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "tenants")
public class Tenant {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String tenantName;

    @Column(nullable = false, unique = true)
    private String tenantSlug;

    @Column(nullable = false)
    private String businessType; // tiles, electronics, grocery

    @Column(columnDefinition = "VARCHAR(50) DEFAULT 'basic'")
    private String subscriptionTier; // basic, pro, enterprise

    @Column(columnDefinition = "BOOLEAN DEFAULT TRUE")
    private Boolean isActive;

    @Column(columnDefinition = "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
    private LocalDateTime createdAt;

    @Column(columnDefinition = "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (isActive == null) isActive = true;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
```

### Create: `backend/src/main/java/com/inventory/entity/User.java`

```java
package com.inventory.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "users", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"tenant_id", "email"}),
    @UniqueConstraint(columnNames = {"tenant_id", "username"})
})
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id", nullable = false)
    private Tenant tenant;

    @Column(nullable = false)
    private String username;

    @Column(nullable = false)
    private String email;

    @Column(nullable = false)
    private String passwordHash;

    @Column(nullable = false)
    private String fullName;

    private String phone;

    @Column(columnDefinition = "VARCHAR(50) DEFAULT 'salesman'")
    private String role; // admin, manager, salesman, warehouse_staff

    @Column(columnDefinition = "BOOLEAN DEFAULT TRUE")
    private Boolean isActive;

    @Column(columnDefinition = "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
    private LocalDateTime createdAt;

    @Column(columnDefinition = "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (isActive == null) isActive = true;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
```

### Create: `backend/src/main/java/com/inventory/entity/Product.java`

```java
package com.inventory.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "products", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"tenant_id", "sku"})
})
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id", nullable = false)
    private Tenant tenant;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private ProductCategory category;

    @Column(nullable = false)
    private String productName;

    @Column(nullable = false)
    private String sku;

    private String description;

    private String size;

    private String type;

    @Column(nullable = false)
    private Double basePrice;

    @Column(columnDefinition = "VARCHAR(50) DEFAULT 'boxes'")
    private String unitOfMeasure;

    private String imageUrl;

    @Column(columnDefinition = "BOOLEAN DEFAULT TRUE")
    private Boolean isActive;

    @Column(columnDefinition = "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
    private LocalDateTime createdAt;

    @Column(columnDefinition = "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (isActive == null) isActive = true;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
```

### Create: `backend/src/main/java/com/inventory/entity/WarehouseLocation.java`

```java
package com.inventory.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "warehouse_locations", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"tenant_id", "location_code"})
})
public class WarehouseLocation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id", nullable = false)
    private Tenant tenant;

    @Column(nullable = false)
    private String locationCode; // A-1-1, B-2-3

    private Integer aisleNumber;   // X axis
    private Integer rackNumber;    // Y axis
    private Integer shelfLevel;    // Z axis (height)

    private Integer capacityBoxes;

    @Column(columnDefinition = "BOOLEAN DEFAULT TRUE")
    private Boolean isActive;

    @Column(columnDefinition = "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (isActive == null) isActive = true;
    }
}
```

### Create: `backend/src/main/java/com/inventory/entity/StockInventory.java`

```java
package com.inventory.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "stock_inventory", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"tenant_id", "product_id", "location_id"})
})
public class StockInventory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id", nullable = false)
    private Tenant tenant;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "location_id", nullable = false)
    private WarehouseLocation location;

    @Column(columnDefinition = "INT DEFAULT 0")
    private Integer quantityOnHand;

    @Column(columnDefinition = "INT DEFAULT 20")
    private Integer reorderLevel;

    @Column(columnDefinition = "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
    private LocalDateTime createdAt;

    @Column(columnDefinition = "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
```

### Create: `backend/src/main/java/com/inventory/entity/Bill.java`

```java
package com.inventory.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "bills", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"tenant_id", "bill_number"})
})
public class Bill {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id", nullable = false)
    private Tenant tenant;

    @Column(nullable = false)
    private String billNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy; // Which salesman/user created this bill

    @Column(name = "bill_date", columnDefinition = "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
    private LocalDateTime billDate;

    @Column(nullable = false)
    private Double subtotal;

    @Column(columnDefinition = "DOUBLE PRECISION DEFAULT 18")
    private Double gstRate;

    @Column(columnDefinition = "VARCHAR(20) DEFAULT 'EXCLUSIVE'")
    private String gstType; // INCLUSIVE, EXCLUSIVE

    private Double gstAmount;

    @Column(columnDefinition = "VARCHAR(50) DEFAULT 'FIXED'")
    private String discountType; // FIXED, PERCENTAGE

    @Column(columnDefinition = "DOUBLE PRECISION DEFAULT 0")
    private Double discountValue;

    @Column(nullable = false)
    private Double totalAmount;

    @Column(columnDefinition = "VARCHAR(50) DEFAULT 'completed'")
    private String billStatus; // draft, completed, cancelled

    private String notes;

    @OneToMany(mappedBy = "bill", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<BillItem> items = new ArrayList<>();

    @Column(columnDefinition = "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
    private LocalDateTime createdAt;

    @Column(columnDefinition = "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        billDate = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
```

---

## Step 7: Create DTOs (Data Transfer Objects)

### Create: `backend/src/main/java/com/inventory/dto/request/LoginRequest.java`

```java
package com.inventory.dto.request;

import lombok.Data;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Email;

@Data
public class LoginRequest {
    @NotBlank(message = "Email required")
    @Email
    private String email;

    @NotBlank(message = "Password required")
    private String password;

    private String tenantSlug; // Which shop is logging in
}
```

### Create: `backend/src/main/java/com/inventory/dto/response/LoginResponse.java`

```java
package com.inventory.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class LoginResponse {
    private String token;
    private String tokenType;
    private Long expiresIn;
    private UserResponse user;
    private TenantResponse tenant;
}
```

### Create: `backend/src/main/java/com/inventory/dto/response/UserResponse.java`

```java
package com.inventory.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class UserResponse {
    private Long id;
    private String username;
    private String email;
    private String fullName;
    private String role;
    private String phone;
}
```

### Create: `backend/src/main/java/com/inventory/dto/response/TenantResponse.java`

```java
package com.inventory.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class TenantResponse {
    private Long id;
    private String tenantName;
    private String tenantSlug;
    private String businessType;
}
```

---

## Step 8: Create Security Configuration

### Create: `backend/src/main/java/com/inventory/security/JwtTokenProvider.java`

```java
package com.inventory.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@Component
public class JwtTokenProvider {
    @Value("${app.jwt.secret}")
    private String jwtSecret;

    @Value("${app.jwt.expiration}")
    private long jwtExpirationMs;

    private Key getSigningKey() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes());
    }

    public String generateToken(Long userId, Long tenantId, String email, String role) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("tenantId", tenantId);
        claims.put("role", role);
        return createToken(claims, email, userId);
    }

    private String createToken(Map<String, Object> claims, String subject, Long userId) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpirationMs);

        return Jwts.builder()
                .setClaims(claims)
                .setSubject(subject)
                .claim("userId", userId)
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .signWith(getSigningKey(), SignatureAlgorithm.HS512)
                .compact();
    }

    public Claims getClaimsFromToken(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    public String getEmailFromToken(String token) {
        return getClaimsFromToken(token).getSubject();
    }

    public Long getUserIdFromToken(String token) {
        return getClaimsFromToken(token).get("userId", Long.class);
    }

    public Long getTenantIdFromToken(String token) {
        return getClaimsFromToken(token).get("tenantId", Long.class);
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parserBuilder()
                    .setSigningKey(getSigningKey())
                    .build()
                    .parseClaimsJws(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }
}
```

---

## Step 9: Create Repositories

### Create: `backend/src/main/java/com/inventory/repository/UserRepository.java`

```java
package com.inventory.repository;

import com.inventory.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmailAndTenantId(String email, Long tenantId);
    Optional<User> findByUsernameAndTenantId(String username, Long tenantId);
    Optional<User> findByIdAndTenantId(Long id, Long tenantId);
}
```

### Create: `backend/src/main/java/com/inventory/repository/TenantRepository.java`

```java
package com.inventory.repository;

import com.inventory.entity.Tenant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TenantRepository extends JpaRepository<Tenant, Long> {
    Optional<Tenant> findByTenantSlug(String slug);
    Optional<Tenant> findByTenantName(String name);
}
```

### Create: `backend/src/main/java/com/inventory/repository/ProductRepository.java`

```java
package com.inventory.repository;

import com.inventory.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    Optional<Product> findBySkuAndTenantId(String sku, Long tenantId);
    List<Product> findByTenantIdAndCategoryId(Long tenantId, Long categoryId);
    List<Product> findByTenantId(Long tenantId);
}
```

---

## Step 10: Run & Test

1. **Update your credentials** in `application.yml`
2. **Run** your Spring Boot application
3. **Test** with Postman:
   ```
   POST http://localhost:8080/api/auth/login
   {
     "email": "rajesh@raj-tiles.com",
     "password": "password",
     "tenantSlug": "raj-tiles"
   }
   ```

---

## Next Steps

Once this foundation is working:
1. Create AuthController and AuthService
2. Create TenantContext for multi-tenancy
3. Create remaining Controllers/Services
4. Build Frontend pages matching the structure
5. Add 3D warehouse visualization
6. Implement reporting features

Would you like me to create any of these in detail?

