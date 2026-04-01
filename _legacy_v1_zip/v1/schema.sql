-- ============================================================
-- IDEAPAÍS — PLATAFORMA INTERNA
-- SCHEMA v2.0 — Ejecutar completo en Supabase SQL Editor
-- ============================================================

-- TABLAS BASE

CREATE TABLE sedes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  region text NOT NULL,
  activa boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE usuarios (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  rol text NOT NULL CHECK (rol IN ('admin', 'gestor', 'encargado', 'comunicaciones', 'estudios', 'editorial', 'internacional', 'ejecutivo')),
  sede_id uuid REFERENCES sedes(id),
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE personas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  apellido text NOT NULL,
  rut text UNIQUE,
  email text UNIQUE,
  telefono text,
  whatsapp text,
  fecha_nac date,
  genero text CHECK (genero IN ('masculino', 'femenino', 'otro', 'prefiero_no_decir')),

  -- Rol en el sistema
  rol_persona text DEFAULT 'Escolar',  -- Escolar, Universitario, Profesional, Alumni, Académico

  -- Estado de la persona
  estado text DEFAULT 'Activo' CHECK (estado IN ('Activo', 'Interesante', 'Inactivo', 'Pausado', 'Egresado', 'Dado de baja')),

  -- Académico
  colegio text,
  tipo_colegio text CHECK (tipo_colegio IN ('municipal', 'part.subv', 'part.pagado')),
  ano_egreso_colegio int,
  universidad text,
  carrera text,
  generacion text,  -- año de egreso estimado

  -- Seguimiento
  proyecto text,
  organizacion_externa text,
  sensibilidades text,
  tags text[],  -- array de tags libres
  como_llego text,
  consentimiento_comunicaciones boolean DEFAULT false,
  canal_preferido text CHECK (canal_preferido IN ('email', 'whatsapp', 'ambos')),

  -- Redes
  instagram text,
  linkedin text,

  -- Notas
  observaciones text,

  -- Control de daños — papelera de corrección (nunca se borra)
  retirado boolean DEFAULT false,
  retirado_at timestamptz,
  retirado_por uuid REFERENCES usuarios(id),  -- quién lo retiró

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
CREATE TRIGGER personas_updated_at BEFORE UPDATE ON personas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE persona_sede (
  persona_id uuid REFERENCES personas(id) ON DELETE CASCADE,
  sede_id uuid REFERENCES sedes(id) ON DELETE CASCADE,
  fecha_ingreso date DEFAULT CURRENT_DATE,
  PRIMARY KEY (persona_id, sede_id)
);

CREATE TABLE rutas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  descripcion text,
  periodo text,
  sede_id uuid REFERENCES sedes(id),
  estado text DEFAULT 'activa' CHECK (estado IN ('activa', 'inactiva', 'completada')),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE hitos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ruta_id uuid REFERENCES rutas(id) ON DELETE CASCADE,
  orden int NOT NULL,
  nombre text NOT NULL,
  descripcion text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE persona_ruta (
  persona_id uuid REFERENCES personas(id) ON DELETE CASCADE,
  ruta_id uuid REFERENCES rutas(id) ON DELETE CASCADE,
  hito_actual int DEFAULT 0,
  estado text DEFAULT 'activo' CHECK (estado IN ('activo', 'completado', 'pausado')),
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (persona_id, ruta_id)
);

CREATE TABLE actividades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sede_id uuid REFERENCES sedes(id),
  nombre text NOT NULL,
  tipo text NOT NULL,  -- congreso, curso, taller, invitacion, mentoria, seminario
  modalidad text CHECK (modalidad IN ('presencial', 'online', 'hibrido')),
  lugar text,
  fecha_inicio date,
  num_sesiones int DEFAULT 1,
  asistencia_minima_pct int DEFAULT 75,
  forma_aprobacion text,
  descripcion text,
  proyecto text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE actividad_hito (
  actividad_id uuid REFERENCES actividades(id) ON DELETE CASCADE,
  hito_id uuid REFERENCES hitos(id) ON DELETE CASCADE,
  PRIMARY KEY (actividad_id, hito_id)
);

CREATE TABLE sesiones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actividad_id uuid REFERENCES actividades(id) ON DELETE CASCADE,
  numero int NOT NULL,
  fecha date,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE asistencias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sesion_id uuid REFERENCES sesiones(id) ON DELETE CASCADE,
  persona_id uuid REFERENCES personas(id) ON DELETE CASCADE,
  presente boolean DEFAULT false,
  nota text,
  registrado_por uuid REFERENCES usuarios(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE (sesion_id, persona_id)
);

CREATE TABLE feedbacks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  persona_id uuid REFERENCES personas(id) ON DELETE CASCADE,
  actividad_id uuid REFERENCES actividades(id) ON DELETE CASCADE,
  tipo text,
  stars int CHECK (stars BETWEEN 1 AND 5),
  participacion int CHECK (participacion BETWEEN 1 AND 5),
  comprension int CHECK (comprension BETWEEN 1 AND 5),
  liderazgo int CHECK (liderazgo BETWEEN 1 AND 5),
  actitud int CHECK (actitud BETWEEN 1 AND 5),
  comentario text,
  recomendacion text,
  registrado_por uuid REFERENCES usuarios(id),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE tareas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sede_id uuid REFERENCES sedes(id) ON DELETE CASCADE,
  titulo text NOT NULL,
  descripcion text,
  tipo_seguimiento text,
  kpi_nombre text,
  kpi_meta numeric,
  kpi_actual numeric DEFAULT 0,
  prioridad text DEFAULT 'media' CHECK (prioridad IN ('alta', 'media', 'baja')),
  estado text DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en_progreso', 'completada', 'atrasada')),
  fecha_limite date,
  respuesta_sede text,
  evaluacion_gestor text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE candidatos_duplicados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  persona_a uuid REFERENCES personas(id) ON DELETE CASCADE,
  persona_b uuid REFERENCES personas(id) ON DELETE CASCADE,
  motivo text,
  confianza numeric,
  estado text DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'fusionado', 'descartado')),
  created_at timestamptz DEFAULT now()
);

-- Log de auditoría (transversal — inmutable)
CREATE TABLE audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid REFERENCES usuarios(id),
  entidad text NOT NULL,          -- 'persona', 'actividad', etc.
  entidad_id uuid,
  accion text NOT NULL,           -- 'create', 'update', 'retiro', 'restaurar', 'import', 'export'
  campo text,
  valor_anterior jsonb,
  valor_nuevo jsonb,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE sedes ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE persona_sede ENABLE ROW LEVEL SECURITY;
ALTER TABLE rutas ENABLE ROW LEVEL SECURITY;
ALTER TABLE hitos ENABLE ROW LEVEL SECURITY;
ALTER TABLE persona_ruta ENABLE ROW LEVEL SECURITY;
ALTER TABLE actividades ENABLE ROW LEVEL SECURITY;
ALTER TABLE actividad_hito ENABLE ROW LEVEL SECURITY;
ALTER TABLE sesiones ENABLE ROW LEVEL SECURITY;
ALTER TABLE asistencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE tareas ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidatos_duplicados ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Helpers
CREATE OR REPLACE FUNCTION get_my_rol()
RETURNS text LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT rol FROM usuarios WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION get_my_sede_id()
RETURNS uuid LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT sede_id FROM usuarios WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION is_admin_or_gestor()
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT get_my_rol() IN ('admin', 'gestor')
$$;

-- SEDES
CREATE POLICY "authenticated_read_sedes" ON sedes FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "admin_write_sedes" ON sedes FOR ALL USING (is_admin_or_gestor());

-- USUARIOS
CREATE POLICY "admin_all_usuarios" ON usuarios FOR ALL USING (is_admin_or_gestor());
CREATE POLICY "self_read_usuario" ON usuarios FOR SELECT USING (id = auth.uid());

-- PERSONAS
CREATE POLICY "admin_gestor_all_personas" ON personas FOR ALL USING (is_admin_or_gestor());
CREATE POLICY "encargado_own_sede_personas" ON personas FOR SELECT
  USING (
    get_my_rol() = 'encargado' AND
    id IN (SELECT persona_id FROM persona_sede WHERE sede_id = get_my_sede_id())
  );
CREATE POLICY "encargado_update_own_sede_personas" ON personas FOR UPDATE
  USING (
    get_my_rol() = 'encargado' AND
    id IN (SELECT persona_id FROM persona_sede WHERE sede_id = get_my_sede_id())
  );
CREATE POLICY "encargado_insert_personas" ON personas FOR INSERT
  WITH CHECK (get_my_rol() = 'encargado');
-- Lectura para otros roles con acceso a personas
CREATE POLICY "other_roles_read_personas" ON personas FOR SELECT
  USING (get_my_rol() IN ('comunicaciones', 'estudios', 'editorial', 'internacional', 'ejecutivo'));

-- PERSONA_SEDE
CREATE POLICY "admin_gestor_all_persona_sede" ON persona_sede FOR ALL USING (is_admin_or_gestor());
CREATE POLICY "encargado_own_sede_persona_sede" ON persona_sede FOR ALL
  USING (get_my_rol() = 'encargado' AND sede_id = get_my_sede_id());

-- RUTAS
CREATE POLICY "all_read_rutas" ON rutas FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "admin_gestor_write_rutas" ON rutas FOR ALL USING (is_admin_or_gestor());

-- HITOS
CREATE POLICY "all_read_hitos" ON hitos FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "admin_gestor_write_hitos" ON hitos FOR ALL USING (is_admin_or_gestor());

-- PERSONA_RUTA
CREATE POLICY "admin_gestor_all_persona_ruta" ON persona_ruta FOR ALL USING (is_admin_or_gestor());
CREATE POLICY "encargado_own_sede_persona_ruta" ON persona_ruta FOR ALL
  USING (
    get_my_rol() = 'encargado' AND
    persona_id IN (SELECT persona_id FROM persona_sede WHERE sede_id = get_my_sede_id())
  );

-- ACTIVIDADES
CREATE POLICY "admin_gestor_all_actividades" ON actividades FOR ALL USING (is_admin_or_gestor());
CREATE POLICY "encargado_own_sede_actividades" ON actividades FOR ALL
  USING (get_my_rol() = 'encargado' AND sede_id = get_my_sede_id());
CREATE POLICY "all_read_actividades" ON actividades FOR SELECT USING (auth.uid() IS NOT NULL);

-- ACTIVIDAD_HITO
CREATE POLICY "all_read_actividad_hito" ON actividad_hito FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "admin_gestor_write_actividad_hito" ON actividad_hito FOR ALL USING (is_admin_or_gestor());
CREATE POLICY "encargado_write_actividad_hito" ON actividad_hito FOR INSERT
  WITH CHECK (
    get_my_rol() = 'encargado' AND
    actividad_id IN (SELECT id FROM actividades WHERE sede_id = get_my_sede_id())
  );

-- SESIONES
CREATE POLICY "admin_gestor_all_sesiones" ON sesiones FOR ALL USING (is_admin_or_gestor());
CREATE POLICY "encargado_own_sede_sesiones" ON sesiones FOR ALL
  USING (
    get_my_rol() = 'encargado' AND
    actividad_id IN (SELECT id FROM actividades WHERE sede_id = get_my_sede_id())
  );
CREATE POLICY "all_read_sesiones" ON sesiones FOR SELECT USING (auth.uid() IS NOT NULL);

-- ASISTENCIAS
CREATE POLICY "admin_gestor_all_asistencias" ON asistencias FOR ALL USING (is_admin_or_gestor());
CREATE POLICY "encargado_own_sede_asistencias" ON asistencias FOR ALL
  USING (
    get_my_rol() = 'encargado' AND
    sesion_id IN (
      SELECT s.id FROM sesiones s
      JOIN actividades a ON s.actividad_id = a.id
      WHERE a.sede_id = get_my_sede_id()
    )
  );

-- FEEDBACKS
CREATE POLICY "admin_gestor_all_feedbacks" ON feedbacks FOR ALL USING (is_admin_or_gestor());
CREATE POLICY "encargado_own_sede_feedbacks" ON feedbacks FOR ALL
  USING (
    get_my_rol() = 'encargado' AND
    actividad_id IN (SELECT id FROM actividades WHERE sede_id = get_my_sede_id())
  );

-- TAREAS
CREATE POLICY "admin_gestor_all_tareas" ON tareas FOR ALL USING (is_admin_or_gestor());
CREATE POLICY "encargado_read_own_tareas" ON tareas FOR SELECT
  USING (get_my_rol() = 'encargado' AND sede_id = get_my_sede_id());
CREATE POLICY "encargado_update_own_tareas" ON tareas FOR UPDATE
  USING (get_my_rol() = 'encargado' AND sede_id = get_my_sede_id());

-- CANDIDATOS DUPLICADOS
CREATE POLICY "admin_gestor_all_duplicados" ON candidatos_duplicados FOR ALL USING (is_admin_or_gestor());

-- AUDIT LOG — solo admin puede leer, todos pueden insertar desde funciones
CREATE POLICY "admin_read_audit" ON audit_log FOR SELECT USING (get_my_rol() = 'admin');
CREATE POLICY "all_insert_audit" ON audit_log FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================
-- DATOS DE EJEMPLO — IDEAPAÍS
-- ============================================================

-- Sedes reales de IdeaPaís
INSERT INTO sedes (id, nombre, region) VALUES
  ('11111111-0000-0000-0000-000000000001', 'Santiago Escolar',    'Región Metropolitana'),
  ('11111111-0000-0000-0000-000000000002', 'Santiago Universitario', 'Región Metropolitana'),
  ('11111111-0000-0000-0000-000000000003', 'O''Higgins',          'Región del Libertador Gral. B. O''Higgins'),
  ('11111111-0000-0000-0000-000000000004', 'Biobío',              'Región del Biobío'),
  ('11111111-0000-0000-0000-000000000005', 'Araucanía',           'Región de La Araucanía'),
  ('11111111-0000-0000-0000-000000000006', 'Los Lagos',           'Región de Los Lagos'),
  ('11111111-0000-0000-0000-000000000007', 'Internacional',       'Internacional');

-- Rutas formativas
INSERT INTO rutas (id, nombre, descripcion, periodo, sede_id, estado) VALUES
  ('22222222-0000-0000-0000-000000000001', 'ELIJO Escolar',         'Ruta de formación política para jóvenes escolares', '2025', '11111111-0000-0000-0000-000000000001', 'activa'),
  ('22222222-0000-0000-0000-000000000002', 'LEP Universitario',     'Liderazgo y Emprendimiento Político para universitarios', '2025', '11111111-0000-0000-0000-000000000002', 'activa'),
  ('22222222-0000-0000-0000-000000000003', 'FOFF — Formadores',     'Formación de formadores para líderes con experiencia', '2025', NULL, 'activa');

-- Hitos ruta ELIJO Escolar
INSERT INTO hitos (id, ruta_id, orden, nombre) VALUES
  ('33333333-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000001', 1, 'Inducción a IdeaPaís'),
  ('33333333-0000-0000-0000-000000000002', '22222222-0000-0000-0000-000000000001', 2, 'Taller de Doctrina Social'),
  ('33333333-0000-0000-0000-000000000003', '22222222-0000-0000-0000-000000000001', 3, 'Congreso Escolar ELIJO'),
  ('33333333-0000-0000-0000-000000000004', '22222222-0000-0000-0000-000000000001', 4, 'Proyecto Territorial');

-- Hitos ruta LEP Universitario
INSERT INTO hitos (id, ruta_id, orden, nombre) VALUES
  ('33333333-0000-0000-0000-000000000005', '22222222-0000-0000-0000-000000000002', 1, 'Diagnóstico de Liderazgo'),
  ('33333333-0000-0000-0000-000000000006', '22222222-0000-0000-0000-000000000002', 2, 'Módulo Economía y Sociedad'),
  ('33333333-0000-0000-0000-000000000007', '22222222-0000-0000-0000-000000000002', 3, 'Taller de Comunicación Política'),
  ('33333333-0000-0000-0000-000000000008', '22222222-0000-0000-0000-000000000002', 4, 'Práctica de Incidencia'),
  ('33333333-0000-0000-0000-000000000009', '22222222-0000-0000-0000-000000000002', 5, 'Certificación LEP');

-- Personas de ejemplo — nombres y universidades chilenas reales
INSERT INTO personas (id, nombre, apellido, rut, email, telefono, genero, rol_persona, estado, colegio, tipo_colegio, universidad, carrera, generacion, como_llego, consentimiento_comunicaciones, canal_preferido) VALUES
  ('44444444-0000-0000-0000-000000000001', 'Valentina',  'Rojas Soto',       '20.123.456-7', 'v.rojas@gmail.com',       '+56912345678', 'femenino',   'Universitaria', 'Activo',      'Liceo N°1',             'municipal',    'Universidad de Chile', 'Derecho',              '2026', 'Redes sociales', true, 'ambos'),
  ('44444444-0000-0000-0000-000000000002', 'Matías',     'González Pérez',   '21.234.567-8', 'm.gonzalez@gmail.com',    '+56923456789', 'masculino',  'Universitario', 'Activo',      'Colegio San Ignacio',   'part.pagado',  'PUC',                  'Ingeniería Comercial', '2025', 'Amigo',          true, 'email'),
  ('44444444-0000-0000-0000-000000000003', 'Isidora',    'Fuentes Araya',    '22.345.678-9', 'i.fuentes@gmail.com',     '+56934567890', 'femenino',   'Universitaria', 'Interesante', 'Liceo Carmela Carvajal','municipal',    'USACH',                'Psicología',           '2026', 'Evento',         true, 'whatsapp'),
  ('44444444-0000-0000-0000-000000000004', 'Diego',      'Morales Castillo', '19.456.789-0', 'd.morales@gmail.com',     '+56945678901', 'masculino',  'Escolar',       'Activo',      'Colegio Pedro de Valdivia','part.subv', NULL,                   NULL,                   NULL,   'Instagram',      false, 'whatsapp'),
  ('44444444-0000-0000-0000-000000000005', 'Catalina',   'Vega Bravo',       '23.567.890-1', 'c.vega@gmail.com',        '+56956789012', 'femenino',   'Universitaria', 'Activo',      'Liceo Bicentenario',    'municipal',    'UV',                   'Educación',            '2027', 'Voluntariado',   true, 'ambos'),
  ('44444444-0000-0000-0000-000000000006', 'Sebastián',  'Mena Ortega',      '24.678.901-2', 's.mena@gmail.com',        '+56967890123', 'masculino',  'Universitario', 'Egresado',    'The Grange School',     'part.pagado',  'UDP',                  'Ciencias Políticas',  '2024', 'Referido',       true, 'email'),
  ('44444444-0000-0000-0000-000000000007', 'Antonia',    'Lagos Fernández',  '18.789.012-3', 'a.lagos@gmail.com',       '+56978901234', 'femenino',   'Profesional',   'Activo',      'Colegio Alemán',        'part.pagado',  'UAI',                  'Derecho',              '2022', 'IdeaPaís Alumni',true, 'ambos'),
  ('44444444-0000-0000-0000-000000000008', 'Nicolás',    'Ibáñez Riquelme',  '25.890.123-4', 'n.ibanez@gmail.com',      '+56989012345', 'masculino',  'Escolar',       'Activo',      'Instituto Nacional',    'municipal',    NULL,                   NULL,                   NULL,   'Profesor',       false, 'whatsapp');

-- Asignar personas a sedes
INSERT INTO persona_sede (persona_id, sede_id, fecha_ingreso) VALUES
  ('44444444-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000002', '2024-03-01'),
  ('44444444-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000002', '2024-03-01'),
  ('44444444-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000002', '2024-04-01'),
  ('44444444-0000-0000-0000-000000000004', '11111111-0000-0000-0000-000000000001', '2024-03-15'),
  ('44444444-0000-0000-0000-000000000005', '11111111-0000-0000-0000-000000000002', '2024-05-01'),
  ('44444444-0000-0000-0000-000000000006', '11111111-0000-0000-0000-000000000002', '2023-03-01'),
  ('44444444-0000-0000-0000-000000000007', '11111111-0000-0000-0000-000000000002', '2022-03-01'),
  ('44444444-0000-0000-0000-000000000008', '11111111-0000-0000-0000-000000000001', '2024-08-01');

-- Asignar personas a rutas
INSERT INTO persona_ruta (persona_id, ruta_id, hito_actual, estado) VALUES
  ('44444444-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000002', 3, 'activo'),
  ('44444444-0000-0000-0000-000000000002', '22222222-0000-0000-0000-000000000002', 5, 'completado'),
  ('44444444-0000-0000-0000-000000000003', '22222222-0000-0000-0000-000000000002', 2, 'activo'),
  ('44444444-0000-0000-0000-000000000004', '22222222-0000-0000-0000-000000000001', 2, 'activo'),
  ('44444444-0000-0000-0000-000000000005', '22222222-0000-0000-0000-000000000002', 1, 'activo'),
  ('44444444-0000-0000-0000-000000000006', '22222222-0000-0000-0000-000000000002', 5, 'completado'),
  ('44444444-0000-0000-0000-000000000007', '22222222-0000-0000-0000-000000000003', 3, 'activo'),
  ('44444444-0000-0000-0000-000000000008', '22222222-0000-0000-0000-000000000001', 1, 'activo');

-- Actividades de ejemplo
INSERT INTO actividades (id, sede_id, nombre, tipo, modalidad, lugar, fecha_inicio, num_sesiones, proyecto) VALUES
  ('55555555-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000002', 'Taller de Comunicación Política', 'taller', 'presencial', 'Casa Central IdeaPaís', '2025-03-10', 3, 'LEP'),
  ('55555555-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000001', 'Inducción Escolar 2025',          'taller', 'presencial', 'Sala Matta', '2025-03-20', 1, 'ELIJO'),
  ('55555555-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000002', 'Congreso LEP 2025',               'congreso','presencial', 'Teatro Municipal', '2025-05-15', 1, 'LEP'),
  ('55555555-0000-0000-0000-000000000004', '11111111-0000-0000-0000-000000000002', 'Seminario Doctrina Social',       'seminario','presencial', 'Auditorio PUC', '2025-04-05', 2, 'FOFF');

-- Sesiones para actividades
INSERT INTO sesiones (actividad_id, numero, fecha) VALUES
  ('55555555-0000-0000-0000-000000000001', 1, '2025-03-10'),
  ('55555555-0000-0000-0000-000000000001', 2, '2025-03-17'),
  ('55555555-0000-0000-0000-000000000001', 3, '2025-03-24'),
  ('55555555-0000-0000-0000-000000000002', 1, '2025-03-20'),
  ('55555555-0000-0000-0000-000000000003', 1, '2025-05-15'),
  ('55555555-0000-0000-0000-000000000004', 1, '2025-04-05'),
  ('55555555-0000-0000-0000-000000000004', 2, '2025-04-12');

-- ============================================================
-- NOTA SOBRE USUARIOS
-- Para crear usuarios gestor/encargado:
-- 1. Ir a Authentication → Users → Invite user con el email Gmail
-- 2. Copiar el UUID generado
-- 3. Ejecutar:
--    INSERT INTO usuarios (id, nombre, rol, sede_id)
--    VALUES ('[uuid]', '[nombre]', 'gestor', null);
--
-- Para encargado de sede:
--    INSERT INTO usuarios (id, nombre, rol, sede_id)
--    VALUES ('[uuid]', '[nombre]', 'encargado', '[sede_id]');
--
-- IDs de sedes disponibles:
--   Santiago Escolar:       11111111-0000-0000-0000-000000000001
--   Santiago Universitario: 11111111-0000-0000-0000-000000000002
--   O'Higgins:              11111111-0000-0000-0000-000000000003
--   Biobío:                 11111111-0000-0000-0000-000000000004
--   Araucanía:              11111111-0000-0000-0000-000000000005
--   Los Lagos:              11111111-0000-0000-0000-000000000006
--   Internacional:          11111111-0000-0000-0000-000000000007
-- ============================================================
