"""In-memory repositories for demonstration purposes."""

from natural_gate.domains.cars.models.models import Car
from natural_gate.domains.reservations.models.models import Reservation


class MemoryStore:
    """Simple in-memory data store with seed data."""

    def __init__(self) -> None:
        self.cars: list[Car] = [
            Car(
                id=1, brand="BMW", model="Serie 3", year=2024, car_type="Sedán",
                seats=5, fuel="Gasolina", transmission="Automática", price_per_day=75,
                color="#1a1a2e",
                description="Elegancia y deportividad en un sedán premium.",
                equipment=["Aire acondicionado bi-zona", "GPS integrado", "Bluetooth",
                           "Sensores de aparcamiento", "Cámara trasera", "Asientos de cuero"],
                mileage_policy="300 km/día incluidos. 0,15€/km adicional.",
                image_emoji="🏎️", available=True, location="Valencia",
            ),
            Car(
                id=2, brand="Volkswagen", model="Golf", year=2024, car_type="Compacto",
                seats=5, fuel="Gasolina", transmission="Manual", price_per_day=45,
                color="#16213e",
                description="El compacto por excelencia. Fiable, cómodo y con un consumo contenido.",
                equipment=["Aire acondicionado", "Bluetooth", "Control de crucero",
                           "Pantalla táctil 8\"", "CarPlay/Android Auto"],
                mileage_policy="250 km/día incluidos. 0,12€/km adicional.",
                image_emoji="🚗", available=True, location="Madrid",
            ),
            Car(
                id=3, brand="Toyota", model="RAV4 Hybrid", year=2025, car_type="SUV",
                seats=5, fuel="Híbrido", transmission="Automática", price_per_day=85,
                color="#0f3460",
                description="SUV híbrido con tracción total.",
                equipment=["Aire acondicionado bi-zona", "GPS", "Bluetooth", "Tracción 4x4",
                           "Cámara 360°", "Portón eléctrico", "Techo panorámico"],
                mileage_policy="350 km/día incluidos. 0,18€/km adicional.",
                image_emoji="🚙", available=True, location="Barcelona",
            ),
            Car(
                id=4, brand="Mercedes-Benz", model="Clase A", year=2024, car_type="Compacto",
                seats=5, fuel="Diésel", transmission="Automática", price_per_day=65,
                color="#533483",
                description="Lujo compacto con la calidad Mercedes.",
                equipment=["Aire acondicionado", "MBUX", "GPS", "Bluetooth",
                           "Asientos calefactables", "Iluminación ambiental"],
                mileage_policy="300 km/día incluidos. 0,15€/km adicional.",
                image_emoji="✨", available=True, location="Valencia",
            ),
            Car(
                id=5, brand="Renault", model="Clio", year=2024, car_type="Compacto",
                seats=5, fuel="Gasolina", transmission="Manual", price_per_day=32,
                color="#e94560",
                description="Económico, ágil y perfecto para moverse por la ciudad.",
                equipment=["Aire acondicionado", "Bluetooth",
                           "Pantalla multimedia 7\"", "Sensores traseros"],
                mileage_policy="200 km/día incluidos. 0,10€/km adicional.",
                image_emoji="🚘", available=True, location="Madrid",
            ),
            Car(
                id=6, brand="Ford", model="Transit Custom", year=2024, car_type="Furgoneta",
                seats=3, fuel="Diésel", transmission="Manual", price_per_day=70,
                color="#1b1b2f",
                description="Furgoneta de carga con amplio espacio.",
                equipment=["Aire acondicionado", "Bluetooth", "Sensores de aparcamiento",
                           "Cámara trasera", "Carga útil 1.400 kg"],
                mileage_policy="200 km/día incluidos. 0,20€/km adicional.",
                image_emoji="🚐", available=True, location="Barcelona",
            ),
            Car(
                id=7, brand="Tesla", model="Model 3", year=2025, car_type="Sedán",
                seats=5, fuel="Eléctrico", transmission="Automática", price_per_day=95,
                color="#162447",
                description="100% eléctrico con autonomía de 510 km.",
                equipment=["Autopilot", "Pantalla 15\"", "Bluetooth",
                           "Carga rápida Supercharger", "Techo de cristal", "Sonido premium"],
                mileage_policy="Kilómetros ilimitados.",
                image_emoji="⚡", available=True, location="Valencia",
            ),
            Car(
                id=8, brand="SEAT", model="Ateca", year=2024, car_type="SUV",
                seats=5, fuel="Gasolina", transmission="Automática", price_per_day=60,
                color="#1a1a2e",
                description="SUV familiar con carácter deportivo.",
                equipment=["Aire acondicionado bi-zona", "GPS", "Bluetooth",
                           "Control de crucero adaptativo", "Asistente de aparcamiento"],
                mileage_policy="300 km/día incluidos. 0,14€/km adicional.",
                image_emoji="🏔️", available=True, location="Madrid",
            ),
        ]

        self.reservations: list[Reservation] = [
            Reservation(
                id="RES-A1B2C3", car_id=1, customer_name="María García López",
                email="maria.garcia@email.com", phone="+34 612 345 678",
                pickup_date="2026-05-20", return_date="2026-05-25",
                pickup_location="Aeropuerto de Valencia", total_price=375,
                status="confirmada", payment_status="paid",
                created_at="2026-05-10T09:30:00",
            ),
            Reservation(
                id="RES-D4E5F6", car_id=3, customer_name="Carlos Martínez Ruiz",
                email="carlos.mtz@email.com", phone="+34 698 765 432",
                pickup_date="2026-05-14", return_date="2026-05-16",
                pickup_location="Oficina Castellón Centro", total_price=170,
                status="en_curso", payment_status="paid",
                created_at="2026-05-08T14:15:00",
            ),
            Reservation(
                id="RES-G7H8I9", car_id=5, customer_name="Laura Fernández Díaz",
                email="laura.fd@email.com", phone="+34 655 112 233",
                pickup_date="2026-04-01", return_date="2026-04-05",
                pickup_location="Estación AVE Valencia", total_price=128,
                status="completada", payment_status="paid",
                created_at="2026-03-28T11:00:00",
            ),
        ]


memory_store = MemoryStore()
