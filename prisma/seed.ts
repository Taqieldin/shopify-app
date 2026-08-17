import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Multi-Tenant Shopify Digital Passport SaaS database...');

  // Clean previous demo data
  await prisma.auditLog.deleteMany();
  await prisma.transferCertificate.deleteMany();
  await prisma.ownershipTransfer.deleteMany();
  await prisma.ownership.deleteMany();
  await prisma.authenticationRiskEvent.deleteMany();
  await prisma.authenticationEvent.deleteMany();
  await prisma.serviceCase.deleteMany();
  await prisma.careSchedule.deleteMany();
  await prisma.warrantyRecord.deleteMany();
  await prisma.lostStolenReport.deleteMany();
  await prisma.creditsLedger.deleteMany();
  await prisma.benefitRedemption.deleteMany();
  await prisma.benefit.deleteMany();
  await prisma.customerMembership.deleteMany();
  await prisma.membershipTier.deleteMany();
  await prisma.eventCheckIn.deleteMany();
  await prisma.clubEvent.deleteMany();
  await prisma.resaleListing.deleteMany();
  await prisma.nFCWriteLog.deleteMany();
  await prisma.passport.deleteMany();
  await prisma.physicalPiece.deleteMany();
  await prisma.shopifyProductReference.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.shopSettings.deleteMany();
  await prisma.shopFeatureFlag.deleteMany();
  await prisma.passportPublicFieldConfig.deleteMany();
  await prisma.shop.deleteMany();

  // =========================================================================
  // TENANT 1: MAISON AURELIA PARIS (Luxury Leather Goods)
  // =========================================================================
  const shop1 = await prisma.shop.create({
    data: {
      shopify_shop_id: 'gid://shopify/Shop/8492019482',
      shop_domain: 'maison-aurelia.myshopify.com',
      status: 'ACTIVE',
      plan: 'PRO',
      settings: {
        create: {
          brand_name: 'Maison Aurelia',
          primary_color: '#1c1917',
          secondary_color: '#78716c',
          accent_color: '#c2410c',
          font_family: 'Playfair Display',
          passport_term: 'Certificat Numérique',
          club_name: 'Le Cercle Aurelia',
          credits_term: 'Points Privilège',
          public_story_enabled: true,
        },
      },
      features: {
        create: {
          digital_passport_enabled: true,
          authentication_enabled: true,
          nfc_enabled: true,
          qr_enabled: true,
          ownership_enabled: true,
          transfer_enabled: true,
          membership_enabled: true,
          credits_enabled: true,
          care_enabled: true,
          service_enabled: true,
          warranty_enabled: true,
        },
      },
      public_field_cfg: {
        create: {
          show_serial: true,
          show_edition: true,
          show_manufacturing_date: true,
          show_location: true,
          show_materials: true,
          show_craft: true,
          show_care: true,
          show_service_history: true,
          show_ownership_status: true,
          show_warranty: true,
        },
      },
    },
  });

  // Tiers for Maison Aurelia
  const tier1Maison = await prisma.membershipTier.create({
    data: {
      shop_id: shop1.id,
      tier_level: 1,
      name: 'Maison Collector',
      code: 'COLLECTOR',
      description: 'Entry into Le Cercle Aurelia with lifetime digital passport verification.',
      badge_color: '#78716c',
      required_spend: 0,
      required_pieces: 1,
      required_credits: 0,
    },
  });

  const tier1Privilege = await prisma.membershipTier.create({
    data: {
      shop_id: shop1.id,
      tier_level: 2,
      name: 'Atelier Privilège',
      code: 'PRIVILEGE',
      description: 'Exclusive access to seasonal trunk shows and complimentary atelier care.',
      badge_color: '#c2410c',
      required_spend: 2500,
      required_pieces: 2,
      required_credits: 500,
    },
  });

  // Benefits for Maison Aurelia
  await prisma.benefit.create({
    data: {
      shop_id: shop1.id,
      tier_id: tier1Privilege.id,
      title: 'Annual Atelier Spa & Leather Conditioning',
      description: 'Complimentary comprehensive inspection and organic wax nourishment at our Paris atelier.',
      benefit_type: 'COMPLIMENTARY_CARE',
      icon_name: 'Sparkles',
      is_active: true,
    },
  });

  await prisma.benefit.create({
    data: {
      shop_id: shop1.id,
      tier_id: tier1Privilege.id,
      title: 'Private Salon Runway Preview Invitation',
      description: 'Front-row invitation to our bi-annual private Haute Maroquinerie showcase in Paris.',
      benefit_type: 'PRIVATE_EVENT',
      icon_name: 'Crown',
      is_active: true,
    },
  });

  // Product 1: The Étoile Top Handle Bag
  const prod1 = await prisma.shopifyProductReference.create({
    data: {
      shop_id: shop1.id,
      shopify_product_id: 'gid://shopify/Product/98412049182',
      shopify_variant_id: 'gid://shopify/ProductVariant/4819201948',
      title: 'The Étoile Flap Top-Handle Bag in Box Calfskin',
      handle: 'etoile-flap-top-handle-bag',
      image_url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=1000&q=80',
      category: 'Handbags & Accessories',
    },
  });

  // Physical Piece 1: AUR-2026-000184
  const piece1 = await prisma.physicalPiece.create({
    data: {
      shop_id: shop1.id,
      product_ref_id: prod1.id,
      serial: 'AUR-2026-000184',
      edition_number: 18,
      edition_total: 100,
      status: 'REGISTERED',
      nfc_uid: '04:7A:B2:99:41:2F:80',
      qr_code_payload: `PASSPORT:${shop1.id}:AUR-2026-000184`,
      manufacturing_date: new Date('2026-02-14'),
      manufacturing_location: 'Atelier Aurelia, Florence, Italy',
      materials_json: JSON.stringify([
        { name: 'Full-Grain Box Calf Leather', origin: 'Tuscany, Italy', certification: 'LWG Gold Rated' },
        { name: '24k Gold-Plated Brass Hardware', origin: 'Arezzo, Italy', certification: 'Precious Alloy' },
        { name: 'Pure Silk Jacquard Lining', origin: 'Lyon, France' },
      ]),
      color: 'Noir Intense with Gold Hardware',
      dimensions: '28 cm x 18 cm x 9 cm',
    },
  });

  // Passport 1
  await prisma.passport.create({
    data: {
      shop_id: shop1.id,
      physical_piece_id: piece1.id,
      status: 'ACTIVE',
      title: 'Digital Passport — Étoile Edition No. 18',
      description: 'Hand-stitched using 140 meters of waxed linen thread and saddle-finished over 42 hours by Master Artisan Matteo Rossi.',
      hero_image_url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=1000&q=80',
      gallery_json: JSON.stringify([
        'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=1000&q=80',
      ]),
      craft_info: 'Traditional double-needle saddle stitch technique, hand-painted edge dyes applied in 7 consecutive coats, individual number engraved on inner brass plate.',
      heritage_story: 'Rooted in 1920s Parisian luggage-making traditions, the Étoile silhouette balances geometric restraint with soft curves.',
      materials_summary: 'Grade A Tuscan Calfskin treated with natural vegetable tanning agents, aging with a lustrous caramel patina.',
      sustainability_data: '100% Traceable European Raw Hides, Zero Waste Offcut Recycling Protocol, Lifetime Restoration Guarantee.',
      public_visibility: true,
      view_count: 342,
    },
  });

  // Care & Warranty for Piece 1
  await prisma.careSchedule.create({
    data: {
      shop_id: shop1.id,
      physical_piece_id: piece1.id,
      interval_months: 12,
      service_type: 'ANNUAL_LEATHER_SPA',
      recommended_action: 'Atelier leather nourishment and beeswax buffing.',
      next_due_date: new Date('2027-02-14'),
    },
  });

  await prisma.warrantyRecord.create({
    data: {
      shop_id: shop1.id,
      physical_piece_id: piece1.id,
      warranty_type: 'LIFETIME_CRAFT_GUARANTEE',
      start_date: new Date('2026-02-14'),
      end_date: new Date('2036-02-14'),
      coverage_summary: 'Covers hardware failure, stitching integrity, edge coating re-application.',
      status: 'ACTIVE',
    },
  });

  // Customer 1 for Shop 1
  const cust1 = await prisma.customer.create({
    data: {
      shop_id: shop1.id,
      shopify_customer_id: 'gid://shopify/Customer/7182930192',
      email: 'claire.delacroix@example.com',
      first_name: 'Claire',
      last_name: 'Delacroix',
      locale: 'fr',
      country: 'France',
    },
  });

  // Active Ownership for Piece 1
  await prisma.ownership.create({
    data: {
      shop_id: shop1.id,
      physical_piece_id: piece1.id,
      customer_id: cust1.id,
      is_active: true,
      source: 'DIRECT_PURCHASE',
      started_at: new Date('2026-03-01'),
    },
  });

  // Membership & Credits for Cust 1
  await prisma.customerMembership.create({
    data: {
      shop_id: shop1.id,
      customer_id: cust1.id,
      tier_id: tier1Privilege.id,
      status: 'ACTIVE',
    },
  });

  await prisma.creditsLedger.createMany({
    data: [
      {
        shop_id: shop1.id,
        customer_id: cust1.id,
        amount: 500,
        type: 'EARN',
        reason: 'Acquisition of Étoile No. 18',
        reference_type: 'ORDER',
        reference_id: 'ORD-99120',
      },
      {
        shop_id: shop1.id,
        customer_id: cust1.id,
        amount: 100,
        type: 'BONUS',
        reason: 'Digital Passport Registration Milestone',
        reference_type: 'PASSPORT',
        reference_id: piece1.id,
      },
    ],
  });

  // Private Club Events for Shop 1
  const eventLive = await prisma.clubEvent.create({
    data: {
      shop_id: shop1.id,
      name: 'Soirée Privée — Paris',
      description: 'An evening of atelier storytelling, rare archive pieces and collector networking at the Aurelia flagship.',
      location: 'Aurelia Flagship, Rue Saint-Honoré, Paris',
      starts_at: new Date('2026-08-20T18:00:00Z'),
      ends_at: new Date('2026-08-20T22:00:00Z'),
      status: 'LIVE',
      credits_award: 150,
      created_by: 'merchant_admin_01',
    },
  });

  const eventPast = await prisma.clubEvent.create({
    data: {
      shop_id: shop1.id,
      name: 'Atelier Open House — Florence',
      description: 'Behind-the-scenes look at the leather atelier with Master Artisan Matteo Rossi.',
      location: 'Atelier Aurelia, Florence, Italy',
      starts_at: new Date('2026-05-15T10:00:00Z'),
      ends_at: new Date('2026-05-15T14:00:00Z'),
      status: 'ENDED',
      credits_award: 100,
      created_by: 'merchant_admin_01',
    },
  });

  await prisma.eventCheckIn.create({
    data: {
      shop_id: shop1.id,
      event_id: eventPast.id,
      customer_id: cust1.id,
      method: 'NFC',
      nfc_uid: piece1.nfc_uid,
      credits_awarded: eventPast.credits_award,
    },
  });

  // Second piece owned by another collector, listed in the resale marketplace
  const pieceShop1Second = await prisma.physicalPiece.create({
    data: {
      shop_id: shop1.id,
      product_ref_id: prod1.id,
      serial: 'AUR-2026-000311',
      edition_number: 42,
      edition_total: 100,
      status: 'REGISTERED',
      nfc_uid: '04:9C:11:77:2E:44:91',
      qr_code_payload: `PASSPORT:${shop1.id}:AUR-2026-000311`,
      manufacturing_date: new Date('2026-03-20'),
      manufacturing_location: 'Atelier Aurelia, Florence, Italy',
      materials_json: JSON.stringify([
        { name: 'Full-Grain Box Calf Leather', origin: 'Tuscany, Italy', certification: 'LWG Gold Rated' },
        { name: '24k Gold-Plated Brass Hardware', origin: 'Arezzo, Italy' },
      ]),
      color: 'Cognac Suede with Palladium Hardware',
      dimensions: '28 cm x 18 cm x 9 cm',
    },
  });

  await prisma.passport.create({
    data: {
      shop_id: shop1.id,
      physical_piece_id: pieceShop1Second.id,
      status: 'ACTIVE',
      title: 'Digital Passport — Étoile Edition No. 42',
      description: 'Cognac suede edition finished with hand-applied edge paint in 7 coats.',
      hero_image_url: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=1000&q=80',
      public_visibility: true,
      view_count: 121,
    },
  });

  const custShop1Second = await prisma.customer.create({
    data: {
      shop_id: shop1.id,
      shopify_customer_id: 'gid://shopify/Customer/8441203107',
      email: 'victor.moreau@example.com',
      first_name: 'Victor',
      last_name: 'Moreau',
      locale: 'fr',
      country: 'France',
    },
  });

  await prisma.ownership.create({
    data: {
      shop_id: shop1.id,
      physical_piece_id: pieceShop1Second.id,
      customer_id: custShop1Second.id,
      is_active: true,
      source: 'DIRECT_PURCHASE',
      started_at: new Date('2026-04-02'),
    },
  });

  await prisma.resaleListing.create({
    data: {
      shop_id: shop1.id,
      physical_piece_id: pieceShop1Second.id,
      seller_customer_id: custShop1Second.id,
      price: 3850,
      currency: 'EUR',
      status: 'LISTED',
      notes: 'Worn twice, full set with dust bag and certificate. Atelier-fresh leather.',
    },
  });

  // Telemetry Event for Piece 1
  await prisma.authenticationEvent.createMany({
    data: [
      {
        shop_id: shop1.id,
        physical_piece_id: piece1.id,
        method: 'NFC',
        result: 'AUTHENTICATED',
        risk_level: 'NORMAL',
        nfc_read_counter: 12,
        country: 'France',
        city: 'Paris',
        ip_hash: 'ip_fr_89.12',
      },
      {
        shop_id: shop1.id,
        physical_piece_id: piece1.id,
        method: 'QR',
        result: 'AUTHENTICATED',
        risk_level: 'NORMAL',
        country: 'France',
        city: 'Paris',
        ip_hash: 'ip_fr_89.12',
      },
    ],
  });

  // Service ticket for Piece 1
  await prisma.serviceCase.create({
    data: {
      shop_id: shop1.id,
      case_number: 'SRV-89412-AURELIA',
      physical_piece_id: piece1.id,
      customer_id: cust1.id,
      service_type: 'CLEANING_AND_CONDITIONING',
      status: 'COMPLETED',
      technician_name: 'Matteo Rossi',
      received_date: new Date('2026-05-10'),
      completed_date: new Date('2026-05-14'),
      warranty_covered: true,
      cost_amount: 0,
      internal_notes: 'Flap corner edge seal touched up with 2 coats of black resin.',
      customer_notes: 'Atelier leather care completed successfully with natural nourishing oils.',
    },
  });

  // =========================================================================
  // TENANT 2: VANGUARD HOROLOGY GENÈVE (Swiss Fine Timepieces)
  // =========================================================================
  const shop2 = await prisma.shop.create({
    data: {
      shopify_shop_id: 'gid://shopify/Shop/9918273645',
      shop_domain: 'vanguard-horology.myshopify.com',
      status: 'ACTIVE',
      plan: 'ENTERPRISE',
      settings: {
        create: {
          brand_name: 'Vanguard Horology',
          primary_color: '#0f172a',
          secondary_color: '#64748b',
          accent_color: '#0284c7',
          font_family: 'Cinzel',
          passport_term: 'Horological Passport',
          club_name: "The Collector's Guild",
          credits_term: 'Guild Credits',
          public_story_enabled: true,
        },
      },
      features: {
        create: {
          digital_passport_enabled: true,
          authentication_enabled: true,
          nfc_enabled: true,
          qr_enabled: true,
          ownership_enabled: true,
          transfer_enabled: true,
          membership_enabled: true,
          credits_enabled: true,
          care_enabled: true,
          service_enabled: true,
          warranty_enabled: true,
        },
      },
      public_field_cfg: {
        create: {
          show_serial: true,
          show_edition: true,
          show_manufacturing_date: true,
          show_location: true,
          show_materials: true,
          show_craft: true,
          show_care: true,
          show_service_history: true,
          show_ownership_status: true,
          show_warranty: true,
        },
      },
    },
  });

  // Watch Piece: VNG-2026-000042
  const prod2 = await prisma.shopifyProductReference.create({
    data: {
      shop_id: shop2.id,
      shopify_product_id: 'gid://shopify/Product/1182947192',
      shopify_variant_id: 'gid://shopify/ProductVariant/552918274',
      title: 'Astralis Tourbillon Monopusher Chronograph 41mm',
      handle: 'astralis-tourbillon-monopusher',
      image_url: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1000&q=80',
      category: 'Haute Horlogerie',
    },
  });

  const piece1b = await prisma.physicalPiece.create({
    data: {
      shop_id: shop2.id,
      product_ref_id: prod2.id,
      serial: 'VNG-2026-000042',
      edition_number: 4,
      edition_total: 25,
      status: 'REGISTERED',
      nfc_uid: '04:E1:88:22:90:3A:99',
      qr_code_payload: `PASSPORT:${shop2.id}:VNG-2026-000042`,
      manufacturing_date: new Date('2026-01-20'),
      manufacturing_location: 'Manufacture Vanguard, Geneva, Switzerland',
      materials_json: JSON.stringify([
        { name: 'Grade 5 Titanium & 950 Platinum', origin: 'Switzerland' },
        { name: 'Anti-Reflective Double Sapphire Crystal', origin: 'Switzerland' },
        { name: 'Hand-Stitched Alligator Leather Strap', origin: 'Geneva' },
      ]),
      color: 'Midnight Blue Guilloché Dial',
      dimensions: '41.5mm Diameter x 12.8mm Thickness',
    },
  });

  await prisma.passport.create({
    data: {
      shop_id: shop2.id,
      physical_piece_id: piece1b.id,
      status: 'ACTIVE',
      title: 'Digital Passport — Astralis Tourbillon No. 04/25',
      description: 'Manufacture Calibre VG-8800 with 72-hour power reserve, single-axis flying tourbillon, and column-wheel chronograph mechanism.',
      hero_image_url: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1000&q=80',
      gallery_json: JSON.stringify([
        'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=1000&q=80',
      ]),
      craft_info: 'Côtes de Genève hand-finishing, anglaged bridge beveling polished with gentian wood, blued titanium screws.',
      heritage_story: 'Conceived in the Vallée de Joux, the Astralis series reimagines astronomical complications with contemporary material science.',
      sustainability_data: 'COSC Certified Chronometer, Ethical Gold Association Standard, 50-Year Movement Service Warranty.',
      public_visibility: true,
      view_count: 512,
    },
  });

  // Customer 2 for Shop 2
  const cust1b = await prisma.customer.create({
    data: {
      shop_id: shop2.id,
      shopify_customer_id: 'gid://shopify/Customer/8819201948',
      email: 'marcus.vance@example.com',
      first_name: 'Marcus',
      last_name: 'Vance',
      locale: 'en',
      country: 'United Kingdom',
    },
  });

  await prisma.ownership.create({
    data: {
      shop_id: shop2.id,
      physical_piece_id: piece1b.id,
      customer_id: cust1b.id,
      is_active: true,
      source: 'DIRECT_PURCHASE',
      started_at: new Date('2026-02-01'),
    },
  });

  await prisma.warrantyRecord.create({
    data: {
      shop_id: shop2.id,
      physical_piece_id: piece1b.id,
      warranty_type: 'EXTENDED_MANUFACTURE_WARRANTY',
      start_date: new Date('2026-02-01'),
      end_date: new Date('2034-02-01'),
      coverage_summary: 'Full chronometric regulation, escapement replacement, water resistance seal renewal.',
      status: 'ACTIVE',
    },
  });

  // Initial Audit Log
  await prisma.auditLog.create({
    data: {
      shop_id: shop1.id,
      actor_type: 'SYSTEM',
      actor_id: 'seed-runner',
      action: 'SYSTEM_BOOTSTRAPPED',
      resource_type: 'SHOP',
      resource_id: shop1.id,
      metadata_json: JSON.stringify({ environment: 'development', tenants: 2 }),
    },
  });

  console.log('✅ Multi-Tenant Database successfully seeded with 2 distinct luxury brands!');
  console.log(`- Tenant 1: Maison Aurelia (${shop1.shop_domain}) with serial AUR-2026-000184`);
  console.log(`- Tenant 2: Vanguard Horology (${shop2.shop_domain}) with serial VNG-2026-000042`);
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
