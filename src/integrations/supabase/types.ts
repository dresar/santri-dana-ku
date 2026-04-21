export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      ajuan_anggaran: {
        Row: {
          bukti_url: string | null
          catatan: string | null
          created_at: string
          id: string
          instansi: string
          judul: string
          kode: string
          pengaju_id: string
          rencana_penggunaan: string
          status: Database["public"]["Enums"]["ajuan_status"]
          total: number
          updated_at: string
        }
        Insert: {
          bukti_url?: string | null
          catatan?: string | null
          created_at?: string
          id?: string
          instansi: string
          judul: string
          kode: string
          pengaju_id: string
          rencana_penggunaan: string
          status?: Database["public"]["Enums"]["ajuan_status"]
          total?: number
          updated_at?: string
        }
        Update: {
          bukti_url?: string | null
          catatan?: string | null
          created_at?: string
          id?: string
          instansi?: string
          judul?: string
          kode?: string
          pengaju_id?: string
          rencana_penggunaan?: string
          status?: Database["public"]["Enums"]["ajuan_status"]
          total?: number
          updated_at?: string
        }
        Relationships: []
      }
      ajuan_items: {
        Row: {
          ajuan_id: string
          created_at: string
          harga: number
          id: string
          nama_item: string
          qty: number
          satuan: string | null
          subtotal: number | null
        }
        Insert: {
          ajuan_id: string
          created_at?: string
          harga?: number
          id?: string
          nama_item: string
          qty?: number
          satuan?: string | null
          subtotal?: number | null
        }
        Update: {
          ajuan_id?: string
          created_at?: string
          harga?: number
          id?: string
          nama_item?: string
          qty?: number
          satuan?: string | null
          subtotal?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ajuan_items_ajuan_id_fkey"
            columns: ["ajuan_id"]
            isOneToOne: false
            referencedRelation: "ajuan_anggaran"
            referencedColumns: ["id"]
          },
        ]
      }
      approval_history: {
        Row: {
          ajuan_id: string
          aksi: string
          approver_id: string
          catatan: string | null
          created_at: string
          id: string
        }
        Insert: {
          ajuan_id: string
          aksi: string
          approver_id: string
          catatan?: string | null
          created_at?: string
          id?: string
        }
        Update: {
          ajuan_id?: string
          aksi?: string
          approver_id?: string
          catatan?: string | null
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "approval_history_ajuan_id_fkey"
            columns: ["ajuan_id"]
            isOneToOne: false
            referencedRelation: "ajuan_anggaran"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          aksi: string
          created_at: string
          detail: Json | null
          id: string
          ip_address: string | null
          modul: string
          user_id: string | null
        }
        Insert: {
          aksi: string
          created_at?: string
          detail?: Json | null
          id?: string
          ip_address?: string | null
          modul: string
          user_id?: string | null
        }
        Update: {
          aksi?: string
          created_at?: string
          detail?: Json | null
          id?: string
          ip_address?: string | null
          modul?: string
          user_id?: string | null
        }
        Relationships: []
      }
      notifikasi: {
        Row: {
          created_at: string
          dibaca: boolean
          id: string
          judul: string
          link: string | null
          pesan: string
          tipe: Database["public"]["Enums"]["notif_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          dibaca?: boolean
          id?: string
          judul: string
          link?: string | null
          pesan: string
          tipe?: Database["public"]["Enums"]["notif_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          dibaca?: boolean
          id?: string
          judul?: string
          link?: string | null
          pesan?: string
          tipe?: Database["public"]["Enums"]["notif_type"]
          user_id?: string
        }
        Relationships: []
      }
      pencairan: {
        Row: {
          ajuan_id: string
          bank: string
          bukti_url: string | null
          created_at: string
          diproses_oleh: string | null
          id: string
          jumlah: number
          nama_pemilik: string
          no_rekening: string
          status: Database["public"]["Enums"]["pencairan_status"]
          updated_at: string
        }
        Insert: {
          ajuan_id: string
          bank: string
          bukti_url?: string | null
          created_at?: string
          diproses_oleh?: string | null
          id?: string
          jumlah: number
          nama_pemilik: string
          no_rekening: string
          status?: Database["public"]["Enums"]["pencairan_status"]
          updated_at?: string
        }
        Update: {
          ajuan_id?: string
          bank?: string
          bukti_url?: string | null
          created_at?: string
          diproses_oleh?: string | null
          id?: string
          jumlah?: number
          nama_pemilik?: string
          no_rekening?: string
          status?: Database["public"]["Enums"]["pencairan_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pencairan_ajuan_id_fkey"
            columns: ["ajuan_id"]
            isOneToOne: false
            referencedRelation: "ajuan_anggaran"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          foto_url: string | null
          id: string
          instansi: string | null
          jabatan: string | null
          nama_lengkap: string
          no_hp: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          foto_url?: string | null
          id: string
          instansi?: string | null
          jabatan?: string | null
          nama_lengkap: string
          no_hp?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          foto_url?: string | null
          id?: string
          instansi?: string | null
          jabatan?: string | null
          nama_lengkap?: string
          no_hp?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      ajuan_status: "draft" | "menunggu" | "disetujui" | "ditolak" | "dicairkan"
      app_role: "admin" | "pengaju" | "approver"
      notif_type: "info" | "sukses" | "peringatan" | "error"
      pencairan_status: "menunggu" | "diproses" | "selesai"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      ajuan_status: ["draft", "menunggu", "disetujui", "ditolak", "dicairkan"],
      app_role: ["admin", "pengaju", "approver"],
      notif_type: ["info", "sukses", "peringatan", "error"],
      pencairan_status: ["menunggu", "diproses", "selesai"],
    },
  },
} as const
